// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Modal from 'antd/lib/modal';

interface Props {
    open: boolean;
    onClose(): void;
    onCancel(): void;
}

function PreloadModal({ open, onClose, onCancel }: Props): JSX.Element {
    return (
        <Modal
            title='Preload data'
            open={open}
            onOk={onClose}
            onCancel={onCancel}
            okText='OK'
            cancelText='Cancel preload'
            className='cvat-preload-modal'
            destroyOnClose
        >
            <p>
                Loading all frame data in the background for faster navigation.
                You can continue working while data is being preloaded.
            </p>
            <p>
                To cancel preloading, click &quot;Cancel preload&quot; or use the menu option.
            </p>
        </Modal>
    );
}

export default React.memo(PreloadModal);
