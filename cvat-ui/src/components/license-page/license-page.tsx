import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CVAT_LICENSE_TEXT = `MIT License

Copyright (C) 2018-2022 Intel Corporation
Copyright (C) 2022-2025 CVAT.ai Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

type Notice = {
    name: string;
    description?: string;
    copyrightLines: string[];
    licenseName: string;
    licenseText: string; // must be verbatim
    // optional metadata fields you can fill later
    homepageUrl?: string;
    sourceCommit?: string;
    modified?: boolean;
};

const Notices: Notice[] = [
    {
        name: 'CVAT (Computer Vision Annotation Tool)',
        copyrightLines: ['Copyright (C) 2018-2022 Intel Corporation', 'Copyright (C) 2022-2025 CVAT.ai Corporation'],
        licenseName: 'MIT License',
        licenseText: CVAT_LICENSE_TEXT,
        sourceCommit: 'cbbdfbe977c46fcba5ad8259994a64e96d6899be',
    },
    // 다른 오픈소스가 추가되면 여기에 항목을 더함
];

function LicensePage(): JSX.Element {
    return (
        <div className='cvat-license-page' style={{ maxWidth: 920, margin: '24px auto' }}>
            <Card bodyStyle={{ padding: 12 }}>
                <Title level={2} style={{ marginTop: 4, marginBottom: 4 }}>
                    Open Source Notices
                </Title>
                <Paragraph type='secondary' style={{ marginBottom: 24 }}>
                    This service uses open-source software. In accordance with the applicable licenses, the original
                    copyright notices and license texts are reproduced in full below.
                </Paragraph>

                <Divider />

                {/* Per-project blocks */}
                {Notices.map((n) => (
                    <div key={n.name} style={{ marginBottom: 32 }}>
                        <Title level={4} style={{ marginBottom: 4 }}>
                            {n.name}
                        </Title>
                        {n.description && <Paragraph style={{ marginBottom: 8 }}>{n.description}</Paragraph>}

                        <Paragraph style={{ marginBottom: 4 }}>
                            <Text strong>License:</Text> {n.licenseName}
                        </Paragraph>

                        {n.homepageUrl && (
                            <Paragraph style={{ marginBottom: 4 }}>
                                <Text strong>Homepage:</Text>{' '}
                                <a href={n.homepageUrl} target='_blank' rel='noopener noreferrer'>
                                    {n.homepageUrl}
                                </a>
                            </Paragraph>
                        )}

                        {n.sourceCommit && (
                            <Paragraph style={{ marginBottom: 4 }}>
                                <Text strong>Upstream Commit:</Text> <Text code>{n.sourceCommit}</Text>
                            </Paragraph>
                        )}

                        {typeof n.modified === 'boolean' && (
                            <Paragraph style={{ marginBottom: 4 }}>
                                <Text strong>Modified by us:</Text> {n.modified ? 'Yes' : 'No'}
                            </Paragraph>
                        )}

                        <Paragraph style={{ marginTop: 12, marginBottom: 8 }}>
                            <Text strong>Original Notices:</Text>
                            <br />
                            {n.copyrightLines.map((line, idx) => (
                                <div key={idx}>{line}</div>
                            ))}
                        </Paragraph>

                        <Paragraph style={{ marginTop: 12, marginBottom: 4 }}>
                            <Text strong>Full License Text (verbatim):</Text>
                        </Paragraph>
                        <pre
                            style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                background: '#f7f7f7',
                                border: '1px solid #eee',
                                borderRadius: 6,
                                padding: 12,
                                maxHeight: 420,
                                overflow: 'auto',
                            }}
                        >
                            {n.licenseText}
                        </pre>
                    </div>
                ))}
            </Card>
        </div>
    );
}

export default React.memo(LicensePage);
