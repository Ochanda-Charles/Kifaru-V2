import React, { useState } from 'react';
import { Upload, message, Button, Progress } from 'antd';
import { DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface CloudinaryUploadProps {
    onUploadSuccess: (url: string) => void;
    onRemove?: () => void;
    folder?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
    onUploadSuccess,
    onRemove,
    folder
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async (file: File) => {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
            message.error('Cloudinary upload is not configured.');
            throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
        }

        setLoading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        if (folder) {
            formData.append('folder', folder);
        }

        try {
            setProgress(25);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || response.statusText || 'Cloudinary upload failed');
            }

            const secureUrl = data.secure_url;
            if (!secureUrl) {
                throw new Error('Cloudinary did not return an image URL');
            }

            setProgress(100);
            setImageUrl(secureUrl);
            onUploadSuccess(secureUrl);
            message.success('Image uploaded successfully!');
        } catch (error: any) {
            console.error('Upload error:', error);
            message.error(error?.message || 'Image upload failed. Please try again.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageUrl(null);
        if (onRemove) onRemove();
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        listType: 'picture',
        showUploadList: false,
        accept: 'image/*',
        beforeUpload: (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files.');
                return Upload.LIST_IGNORE;
            }

            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB.');
                return Upload.LIST_IGNORE;
            }

            return true;
        },
        customRequest: ({ file, onSuccess, onError }) => {
            handleUpload(file as File)
                .then(() => {
                    if (onSuccess) onSuccess('ok');
                })
                .catch((err) => {
                    if (onError) onError(err as Error);
                });
        },
    };

    return (
        <div className="w-full">
            {imageUrl ? (
                <div className="relative group border rounded-lg overflow-hidden h-64 flex items-center justify-center bg-gray-50 border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt="Uploaded product"
                        className="h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                            danger
                            type="primary"
                            icon={<DeleteOutlined />}
                            onClick={handleRemove}
                        >
                            Remove Image
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="h-64">
                    <Dragger {...uploadProps} style={{ height: '100%', background: '#fafafa' }} disabled={loading}>
                        <p className="ant-upload-drag-icon">
                            <CloudUploadOutlined style={{ color: '#7c3aed' }} />
                        </p>
                        <p className="ant-upload-text">Click or drag image to this area to upload</p>
                        <p className="ant-upload-hint">
                            Support for a single image upload.
                        </p>
                        {loading && (
                            <div className="px-8 mt-4">
                                <Progress percent={progress} status="active" strokeColor="#7c3aed" />
                            </div>
                        )}
                    </Dragger>
                </div>
            )}
        </div>
    );
};

export default CloudinaryUpload;
