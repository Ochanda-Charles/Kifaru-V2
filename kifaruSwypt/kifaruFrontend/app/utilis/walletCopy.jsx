import React from 'react';
import { CopyOutlined } from '@ant-design/icons';
import { message, Typography } from 'antd';

const { Text } = Typography;


const WalletAddressWithCopy = ({ address }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
      .then(() => message.success('Copied to clipboard!'))
      .catch(() => message.error('Failed to copy'));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Text>{address}</Text>
      <CopyOutlined 
        style={{ cursor: 'pointer' }} 
        onClick={copyToClipboard} 
        title="Copy wallet address" 
      />
    </div>
  );
};

export default WalletAddressWithCopy;
