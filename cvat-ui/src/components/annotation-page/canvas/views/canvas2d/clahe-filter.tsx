// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col } from 'antd/lib/grid';
import { throttle } from 'lodash';
import Text from 'antd/lib/typography/Text';
import Slider from 'antd/lib/slider';
import notification from 'antd/lib/notification';

import { CombinedState } from 'reducers';
import {
    enableImageFilter,
    disableImageFilter,
} from 'actions/settings-actions';
import openCVWrapper from 'utils/opencv-wrapper/opencv-wrapper';
import CLAHEImplementation from 'utils/opencv-wrapper/clahe';
import { ImageFilterAlias, hasFilter } from 'utils/image-processing';

const defaultTileGridSize = 8;

export default function ClaheFilter(): JSX.Element {
    const dispatch = useDispatch();
    const [clipLimit, setClipLimit] = useState<number>(0);
    const [tileGridSize, setTileGridSize] = useState<number>(defaultTileGridSize);
    const [initializing, setInitializing] = useState<boolean>(false);
    const filters = useSelector((state: CombinedState) => state.settings.imageFilters);
    const claheFilter = hasFilter(filters, ImageFilterAlias.CLAHE);

    const ensureInitialized = useCallback(async (): Promise<boolean> => {
        if (openCVWrapper.isInitialized) {
            return true;
        }

        setInitializing(true);
        try {
            await openCVWrapper.initialize(throttle(() => {}, 500));
            return true;
        } catch (error: any) {
            notification.error({
                description: error.toString(),
                message: 'Could not initialize OpenCV library',
            });
            return false;
        } finally {
            setInitializing(false);
        }
    }, []);

    const applyClahe = useCallback((clip: number, tile: number): void => {
        if (claheFilter) {
            dispatch(enableImageFilter(claheFilter, { clipLimit: clip, tileGridSize: tile }));
        } else {
            dispatch(enableImageFilter({
                modifier: openCVWrapper.imgproc.clahe(clip, tile),
                alias: ImageFilterAlias.CLAHE,
            }));
        }
    }, [claheFilter]);

    // onChange(드래그 중)는 시각적 갱신만 — 핸들이 마우스를 부드럽게 따라오도록 가볍게 유지.
    // 무거운 CLAHE 재연산은 onChangeComplete(드래그를 놓을 때)에서 한 번만 수행.
    const onChangeClipLimitComplete = useCallback(async (newClipLimit: number): Promise<void> => {
        if (newClipLimit === 0) {
            if (claheFilter) {
                dispatch(disableImageFilter(ImageFilterAlias.CLAHE));
            }
            return;
        }

        const initialized = await ensureInitialized();
        if (initialized) {
            applyClahe(newClipLimit, tileGridSize);
        }
    }, [claheFilter, tileGridSize, ensureInitialized, applyClahe]);

    const onChangeTileGridSizeComplete = useCallback((newTileGridSize: number): void => {
        if (claheFilter && clipLimit > 0) {
            applyClahe(clipLimit, newTileGridSize);
        }
    }, [claheFilter, clipLimit, applyClahe]);

    useEffect(() => {
        if (claheFilter) {
            const modifier = claheFilter.modifier as CLAHEImplementation;
            setClipLimit(modifier.clipLimit);
            setTileGridSize(modifier.tileGridSize);
        } else {
            setClipLimit(0);
            setTileGridSize(defaultTileGridSize);
        }
    }, [filters]);

    return (
        <div className='cvat-image-setups-filters'>
            <Row justify='space-around'>
                <Col span={24}>
                    <Row className='cvat-image-setups-clahe-clip-limit'>
                        <Col span={6}>
                            <Text className='cvat-text-color'> CLAHE clip </Text>
                        </Col>
                        <Col span={12}>
                            <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                value={clipLimit}
                                disabled={initializing}
                                onChange={setClipLimit}
                                onChangeComplete={onChangeClipLimitComplete}
                            />
                        </Col>
                    </Row>
                    <Row className='cvat-image-setups-clahe-tile-grid-size'>
                        <Col span={6}>
                            <Text className='cvat-text-color'> CLAHE tile </Text>
                        </Col>
                        <Col span={12}>
                            <Slider
                                min={2}
                                max={16}
                                step={1}
                                value={tileGridSize}
                                disabled={initializing || clipLimit === 0}
                                onChange={setTileGridSize}
                                onChangeComplete={onChangeTileGridSizeComplete}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
