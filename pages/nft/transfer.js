import BackButton from "@/src/components/BackButton";
import React, { useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import ERC721ABI from "@config/erc721_abi.json";
import { ethers } from "ethers";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

const tokenContractInfo = [
  {
    symbol: "RBRB",
    name: "ROBINNFT",
    mainNetSymbol: "MATIC",
    mainNetName: "Polygon",
    contractAddr: "0x3638B710CDeFe97714F0F80BBB6fED3B66a857Cd",
    rpc: "https://polygon-rpc.com/",
    chainId: 137, // 0x504 in hex,
    scanURL: "https://polygonscan.com/",
  },
];

const transferPage = ({ data }) => {
  const myAddress = data?.address;
  const router = useRouter();
  const [uid, setUid] = useState();
  const [space, setSpace] = useState();
  const [url, setUrl] = useState();
  const [checkGasPrice, setGasPrice] = useState(0);
  const [sendId, setSendId] = useState("");
  const [sendAddress, setSendAddress] = useState("");

  /*
   ** Connect Provider, Wallet to net
   */
  const provider = new ethers.providers.JsonRpcProvider(
    tokenContractInfo[0].rpc
  );
  const wallet = new ethers.Wallet(data?.privateKey, provider);
  const handleTransfer = async () => {
    const gasPrice_ = await provider.getGasPrice();
    const gasPrice = ethers.utils.hexlify(parseInt(gasPrice_));

    const tx = {
      from: myAddress,
      to: sendAddress,
      tokenId: sendId,
      // gasLimit: ethers.utils.hexlify("0x100000"),
      gasLimit: 90000,
      gasPrice: gasPrice,
    };

    const walletSigner = wallet.connect(provider);
    const tokenContract = new ethers.Contract(
      tokenContractInfo[0].contractAddr,
      ERC721ABI,
      wallet
    );

    try {
        const res = await tokenContract.transferFrom(tx.from, tx.to, tx.tokenId, {
          gasLimit: tx.gasLimit,
          gasPrice: tx.gasPrice
        });
        toast("전송 되었습니다.")
    } catch(err) {
        console.log(err)
        toast.error("일시적인 오류입니다. 잠시 후 다시 시도해주세요.")
    }
  };

  const getGasPriceMethod = async () => {
    setGasPrice("Loading...");
    try {
      const gasPrice_ = await provider.getGasPrice();
      const res = ethers.utils.formatUnits(gasPrice_, "gwei");
      setGasPrice(parseInt(res));
    } catch (err) {
      console.log(err);
    }
  };

  const transferHandler = () => {
    confirmAlert({
      title: "NFT 이체",
      message: "NFT를 이체하시겠습니까?",
      buttons: [
        {
          label: "확인",
          onClick: async () => {
            await handleTransfer();
          },
        },
        {
          label: "취소",
        },
      ],
    });
  };

  return (
    <div className="container">
      <BackButton />
      <button className="basicButton bkButton" onClick={() => router.back()}>🔙 Back</button>
      <h2>NFT 이체</h2>
      <p>From: {myAddress}</p>
      <div className="sendbox">
        <label>
          To:
          <input
            type="text"
            placeholder="이체할 주소"
            value={sendAddress}
            onChange={(e) => setSendAddress(e.target.value)}
          />
        </label>
        <label>
          Token Index:
          <input
            type="number"
            placeholder="Token Index"
            value={sendId}
            onChange={(e) => setSendId(e.target.value)}
          />
        </label>
        <button
          className="basicButton sbButton"
          type="button"
          onClick={handleTransfer}
        >
          이체하기
        </button>
      </div>
      <div className="box">
        <button className="basicButton chButton" onClick={getGasPriceMethod}>
          Gas Price 조회
        </button>
        <span className="box"> Gas Price: {checkGasPrice}</span>
      </div>
    </div>
  );
};

export async function getServerSideProps({ query }) {
  const myPrivateKey = query?.privateKey;
  const myAddress = query?.address;

  // 지갑 연결 =================================================
  const provider = new ethers.providers.JsonRpcProvider(
    tokenContractInfo[0].rpc
  );

  const wallet = new ethers.Wallet(myPrivateKey, provider);

  const balance = await ethers.utils.formatEther(
    await provider.getBalance(myAddress)
  );

  // 토큰 연결 ===========================================================

  const tokenContract = new ethers.Contract(
    tokenContractInfo[0].contractAddr,
    ERC721ABI,
    wallet
  );

  // Read-Only Methods =================================================

  const tokenName = await tokenContract.name();
  const tokenOwner = await tokenContract.owner();
  const tokenSymbol = await tokenContract.symbol();
  // balanceOf 실행 -> 자리 수 변환
  const tokenBigNumber = await tokenContract.balanceOf(myAddress);
  const tokenBalance = ethers.utils.formatUnits(tokenBigNumber, 0);

  const res = {
    name: tokenName,
    balance: tokenBalance,
    address: myAddress,
    privateKey: myPrivateKey,
  };

  return {
    props: { data: res },
  };
}

export default transferPage;
