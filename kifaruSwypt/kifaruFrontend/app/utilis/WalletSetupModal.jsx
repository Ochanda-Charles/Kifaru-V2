import React, { useState } from "react";
import { Modal, Button, Input, Typography, message, Divider, Tag } from "antd";
import { isAddress } from "ethers";
import { CheckCircleOutlined, SwapOutlined, CopyOutlined, WalletOutlined } from "@ant-design/icons";
import api from "@/app/utilis/api";

const { Text, Title } = Typography;

const WalletSetupModal = ({ visible, onClose, onSubmit, merchant_id, currentWallet }) => {
  const [wallet_address, setWalletAddress] = useState("");
  const [switching, setSwitching] = useState(false);

  const hasWallet = currentWallet && currentWallet.trim() !== "";

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

      message.success(hasWallet ? "Wallet address updated successfully" : "Wallet saved successfully");
      onSubmit(wallet_address);
      setWalletAddress("");
      setSwitching(false);
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save wallet";
      message.error(errorMsg);
    }
  };

  const handleClose = () => {
    setWalletAddress("");
    setSwitching(false);
    onClose();
  };

  const truncateAddress = (addr) => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(currentWallet);
    message.success("Wallet address copied");
  };

  const showForm = !hasWallet || switching;

  return (
    <Modal
      title={
        <Title level={4} className="font-bold text-gray-800 mb-0">
          {hasWallet && !switching ? "Your Wallet" : switching ? "Switch Wallet" : "Wallet Setup"}
        </Title>
      }
      open={visible}
      onCancel={handleClose}
      footer={
        showForm
          ? [
              <Button key="cancel" onClick={handleClose} className="rounded-lg px-6 h-10 font-medium border border-gray-300 text-gray-800 hover:bg-gray-50">
                Cancel
              </Button>,
              <Button key="save" type="primary" onClick={handleSave} className="rounded-lg px-6 h-10 font-medium bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 shadow-sm text-white">
                {hasWallet ? "Update Wallet" : "Save Wallet"}
              </Button>,
            ]
          : [
              <Button key="close" onClick={handleClose} className="rounded-lg px-6 h-10 font-medium border border-gray-300 text-gray-800 hover:bg-gray-50">
                Close
              </Button>,
            ]
      }
      centered
      width={480}
      className="rounded-xl overflow-hidden shadow-lg"
      styles={{
        body: { padding: "24px 32px" },
        mask: { backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" },
      }}
    >
      {hasWallet && !switching ? (
        <div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 18 }} />
              <Text className="text-green-700 font-semibold text-sm">Wallet Connected</Text>
            </div>
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
              <Text className="font-mono text-gray-700 text-sm">{truncateAddress(currentWallet)}</Text>
              <Button type="text" icon={<CopyOutlined />} onClick={copyAddress} size="small" className="text-gray-500 hover:text-green-600" />
            </div>
          </div>

          <Button
            icon={<SwapOutlined />}
            onClick={() => setSwitching(true)}
            block
            className="rounded-lg h-10 font-medium border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600"
          >
            Switch Wallet Address
          </Button>
        </div>
      ) : (
        <div>
          {switching && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
              <Text className="text-amber-700 text-sm">
                Current wallet: <span className="font-mono font-medium">{truncateAddress(currentWallet)}</span>
              </Text>
            </div>
          )}

          <div className="text-center mb-6">
            <Button type="primary" disabled className="w-full mb-4 rounded-lg font-semibold bg-blue-400 border-blue-400 opacity-70 cursor-not-allowed h-10">
              Connect Wallet (Coming Soon)
            </Button>
            <Text className="block text-sm text-gray-600">Or enter your wallet address manually below</Text>
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
        </div>
      )}
    </Modal>
  );
};

export default WalletSetupModal;
