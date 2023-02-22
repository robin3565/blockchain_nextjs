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

const mintPage = ({ data }) => {
  const myAddress = data?.address;
  const router = useRouter();
  const [uid, setUid] = useState();
  const [space, setSpace] = useState();
  const [url, setUrl] = useState();
  const [checkGasPrice, setGasPrice] = useState(0);

  /*
   ** Connect Provider, Wallet to net
   */
  const provider = new ethers.providers.JsonRpcProvider(
    tokenContractInfo[0].rpc
  );
  const wallet = new ethers.Wallet(data?.privateKey, provider);

  const handleMinting = async () => {
    const gasPrice_ = await provider.getGasPrice();
    const gasPrice = ethers.utils.hexlify(parseInt(gasPrice_));

    const mintingInfo = {
      owner: data?.address,
      uid: uid,
      space: space,
      url: url,
      gasLimit: 90000,
      gasPrice: gasPrice,
    };

    const tokenContract = new ethers.Contract(
      tokenContractInfo[0].contractAddr,
      ERC721ABI,
      wallet
    );

    try {
      const res = await tokenContract.safeMint(
        mintingInfo.owner,
        mintingInfo.uid,
        mintingInfo.space,
        mintingInfo.url,
        { gasLimit: mintingInfo.gasLimit, gasPrice: mintingInfo.gasPrice }
      );
      toast("생성 되었습니다.");
    } catch (err) {
      console.log(err);
      toast.error("잠시 후 다시 시도해주세요.");
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

  const confirmHandler = () => {
    confirmAlert({
      title: "NFT 생성",
      message: "NFT를 생성하시겠습니까?",
      buttons: [
        {
          label: "확인",
          onClick: async () => {
            await handleMinting();
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
      <button className="basicButton bkButton" onClick={() => router.back()}>
        🔙 Back
      </button>
      <h2>NFT 생성(민팅)</h2>
      <div>
        <p>Owner Address: {data?.address}</p>
        <label>
          uid:
          <input
            type="text"
            placeholder="uid"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
          />
        </label>
        <label>
          평수:
          <input
            type="text"
            placeholder="평수"
            value={space}
            onChange={(e) => setSpace(e.target.value)}
          />
        </label>
        <div className="sendbox">
          <label>
            인증서 url(이미지):
            <input
              type="text"
              placeholder="인증서 url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <button
            className="basicButton sbButton"
            type="button"
            onClick={confirmHandler}
          >
            NFT 생성(민팅)
          </button>
        </div>
        <div className="box">
          <button className="basicButton chButton" onClick={getGasPriceMethod}>
            Gas Price 조회
          </button>
          <span className="box"> Gas Price: {checkGasPrice}</span>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps({ query }) {
  const myPrivateKey = query?.privateKey;
  const myAddress = query?.address;

  // 노드 및 지갑 연결 =================================================
  const provider = new ethers.providers.JsonRpcProvider(
    tokenContractInfo[0].rpc
  );

  const wallet = new ethers.Wallet(myPrivateKey, provider);

  const balance = await ethers.utils.formatEther(
    await provider.getBalance(myAddress)
  );

  // S.C 연결 ===========================================================

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

export default mintPage;
