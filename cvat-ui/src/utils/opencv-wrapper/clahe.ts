// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import {
    BaseImageFilter, ImageProcessing, ImageFilterAlias, SerializedImageFilter,
} from 'utils/image-processing';

export interface CLAHEFilterOptions {
    clipLimit: number;
    tileGridSize: number;
}

export interface CLAHEFilter extends ImageProcessing {
    processImage: (src: ImageData, frameNumber: number) => ImageData;
}

export default class CLAHEImplementation extends BaseImageFilter {
    private cv: any;
    #clipLimit: number;
    #tileGridSize: number;

    constructor(cv: any, options: CLAHEFilterOptions) {
        super();
        this.cv = cv;
        this.#clipLimit = options.clipLimit;
        this.#tileGridSize = options.tileGridSize;
    }

    public processImage(src: ImageData, frameNumber: number): ImageData {
        const { cv } = this;
        let matImage = null;
        const RGBImage = new cv.Mat();
        const YUVImage = new cv.Mat();
        const RGBDist = new cv.Mat();
        const YUVDist = new cv.Mat();
        const RGBADist = new cv.Mat();
        let channels = new cv.MatVector();
        const equalizedY = new cv.Mat();
        let clahe = null;
        try {
            this.currentProcessedImage = frameNumber;
            matImage = cv.matFromImageData(src);
            cv.cvtColor(matImage, RGBImage, cv.COLOR_RGBA2RGB, 0);
            cv.cvtColor(RGBImage, YUVImage, cv.COLOR_RGB2YUV, 0);
            cv.split(YUVImage, channels);
            const [Y, U, V] = [channels.get(0), channels.get(1), channels.get(2)];
            channels.delete();
            channels = null;
            clahe = new cv.CLAHE(this.#clipLimit, new cv.Size(this.#tileGridSize, this.#tileGridSize));
            clahe.apply(Y, equalizedY);
            Y.delete();
            channels = new cv.MatVector();
            channels.push_back(equalizedY); equalizedY.delete();
            channels.push_back(U); U.delete();
            channels.push_back(V); V.delete();
            cv.merge(channels, YUVDist);
            cv.cvtColor(YUVDist, RGBDist, cv.COLOR_YUV2RGB, 0);
            cv.cvtColor(RGBDist, RGBADist, cv.COLOR_RGB2RGBA, 0);
            const arr = new Uint8ClampedArray(RGBADist.data, RGBADist.cols, RGBADist.rows);
            const imgData = new ImageData(arr, src.width, src.height);
            return imgData;
        } catch (e: unknown) {
            throw e instanceof Error ? e : new Error('Unknown error');
        } finally {
            if (matImage) {
                matImage.delete();
            }

            if (channels) {
                channels.delete();
            }

            if (clahe) {
                clahe.delete();
            }

            RGBImage.delete();
            YUVImage.delete();
            RGBDist.delete();
            YUVDist.delete();
            RGBADist.delete();
        }
    }

    public configure(options: object): void {
        const { clipLimit, tileGridSize } = options as Partial<CLAHEFilterOptions>;
        if (typeof clipLimit === 'number') {
            this.#clipLimit = clipLimit;
        }
        if (typeof tileGridSize === 'number') {
            this.#tileGridSize = tileGridSize;
        }
    }

    public toJSON(): SerializedImageFilter {
        return {
            alias: ImageFilterAlias.CLAHE,
            params: {
                clipLimit: this.#clipLimit,
                tileGridSize: this.#tileGridSize,
            },
        };
    }

    get clipLimit(): number {
        return this.#clipLimit;
    }

    get tileGridSize(): number {
        return this.#tileGridSize;
    }
}
