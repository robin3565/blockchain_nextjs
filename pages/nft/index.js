import React, { useState } from "react";
import ERC721ABI from "@config/erc721_abi.json";
import { ethers } from "ethers";
import Link from "next/link";
import BackButton from "@/src/components/BackButton";

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

const NFTPage = ({ data }) => {
  const myAddress = data?.address;
  const [isOwner, setOwner] = useState(
    myAddress == process.env.NEXT_PUBLIC_API_ADDRESS ? true : false
  );

  return (
    <>
      <div className="container">
        <BackButton />
        {isOwner && (
          <Link
            className="mintLink"
            href={{
              pathname: "/nft/mint",
              query: {
                address: data?.address,
                privateKey: data?.privateKey,
              },
            }}
          >
            NFT 민팅 바로가기
          </Link>
        )}

        <Link
          className="mintLink"
          href={{
            pathname: "/nft/transfer",
            query: {
              address: data?.address,
              privateKey: data?.privateKey,
            },
          }}
        >
          NFT 이체 바로가기
        </Link>
        <h2>보유 NFT</h2>
        <p className="impress"><b>총 보유량:</b> {data?.balance}</p>
        {data?.tokenInfo?.map((item, idx) => (
          <div key={idx}>
            <h3>No. 0{idx + 1}</h3>
            <p><b>NFT Token:</b> {data?.name}</p>
            <p><b>NFT Index:</b> {item?.tokenIndex}</p>
            <p><b>NFT 평수:</b> {item?.space}평</p>
            <img src={`${item?.certificationUrl}`} />
          </div>
        ))}
      </div>
    </>
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

  // NFT 정보 가져오기
  // 가지고 있는 NFT index 불러오기 
  let tokenIndex = [];
  for (let i = 0; i < parseInt(tokenBalance); i++) {
    let ownerbyIndex = await tokenContract.tokenOfOwnerByIndex(myAddress, i);
    let temp = ethers.utils.formatUnits(ownerbyIndex, 0);
    tokenIndex.push(temp);
  }

  // index 값에 해당하는 NFT 정보 저장 및 리턴
  let tokenInfo = [];
  for (let i = 0; i < tokenIndex.length; i++) {
    let temp = await tokenContract.getTokenInfo(tokenIndex[i]);
    tokenInfo.push({...temp, tokenIndex: tokenIndex[i]});
  }

  const res = {
    name: tokenName,
    balance: tokenBalance,
    tokenInfo: tokenInfo,
    address: myAddress,
    privateKey: myPrivateKey,
  };

  return {
    props: { data: res },
  };
}

export default NFTPage;
