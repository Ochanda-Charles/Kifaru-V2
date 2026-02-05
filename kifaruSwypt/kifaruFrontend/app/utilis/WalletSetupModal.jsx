import React, { useState } from "react";
import { Modal, Button, Input, Typography, message, Divider } from "antd";
import { isAddress } from "ethers";
import api from "@/app/utilis/api";

const { Text, Title } = Typography;

const WalletSetupModal = ({ visible, onClose, onSubmit, merchant_id }) => {
  const [wallet_address, setWalletAddress] = useState("");

  const handleSave = async () => {
    if (!isAddress(wallet_address)) {
      message.error("Please enter a valid Ethereum wallet address");
      return;
    }

    if (!merchant_id) {
      message.error("Merchant ID is missing");
      return;
    }

    try {
      await api.post("/savewallet", {
        wallet_address,
        merchant_id,
      });

      message.success("Wallet saved successfully");
      onSubmit(wallet_address);
      setWalletAddress("");
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save wallet";
      message.error(errorMsg);
    }
  };

  return (
    <Modal
      title={<Title level={4} className="font-bold text-gray-800 mb-0">Wallet Setup</Title>}
      open={visible}
      onCancel={() => {
        setWalletAddress("");
        onClose();
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            setWalletAddress("");
            onClose();
          }}
          className="rounded-lg px-6 h-10 font-medium border border-gray-300 text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleSave}
          className="rounded-lg px-6 h-10 font-medium bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 shadow-sm text-white"
        >
          Save Wallet
        </Button>,
      ]}
      centered
      width={480}
      className="rounded-xl overflow-hidden shadow-lg"
      styles={{
        body: {
          padding: "24px 32px", // replaces `bodyStyle`
        },
        mask: {
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(0,0,0,0.45)",
        },
      }}
    >
      <div className="text-center mb-6">
        <Button
          type="primary"
          disabled
          className="w-full mb-4 rounded-lg font-semibold bg-blue-400 border-blue-400 opacity-70 cursor-not-allowed h-10"
        >
          Connect Wallet (Coming Soon)
        </Button>
        <Text className="block text-sm text-gray-600">
          Or enter your wallet address manually below
        </Text>
      </div>

      <Divider className="my-4" />

      <Input
        placeholder="0x..."
        value={wallet_address}
        onChange={(e) => setWalletAddress(e.target.value.trim())}
        size="large"
        className="rounded-lg h-10 font-mono text-gray-800"
      />
      <Text className="block mt-2 text-xs text-center text-gray-500 font-medium">
        Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
      </Text>
    </Modal>
  );
};

export default WalletSetupModal;
