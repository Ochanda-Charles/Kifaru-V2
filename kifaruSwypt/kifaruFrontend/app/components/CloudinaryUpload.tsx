import React, { useState } from 'react';
import { Upload, message, Button, Progress } from 'antd';
import { InboxOutlined, DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';

const { Dragger } = Upload;

// Dedicated axios instance for Cloudinary uploads — the default instance has
// a global Authorization header (set in dashboard layout) that Cloudinary rejects.
const cloudinaryAxios = axios.create();

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
    folder = "kifaru_products"
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = async (file: File) => {
        setLoading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', folder);

        try {
            const response = await cloudinaryAxios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setProgress(percent);
                        }
                    },
                }
            );

            const secureUrl = response.data.secure_url;
            setImageUrl(secureUrl);
            onUploadSuccess(secureUrl);
            message.success('Image uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Image upload failed. Please try again.');
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
        customRequest: ({ file, onSuccess, onError }) => {
            handleUpload(file as File).then(() => {
                if (onSuccess) onSuccess("ok");
            }).catch((err) => {
                if (onError) onError(err as Error);
            });
        },
        accept: "image/*"
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
