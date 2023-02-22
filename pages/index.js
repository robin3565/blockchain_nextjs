import Link from "next/link";
import React, { useState } from "react";

const HomePage = () => {
  const [address, setAddress] = useState(process.env.NEXT_PUBLIC_API_ADDRESS);
  const [privateKey, setPrivateKey] = useState(process.env.NEXT_PUBLIC_API_PRIVATE_KEY);

  return (
    <div className="container">
      <div>
        <h3>기본 정보 입력하기</h3>
        <div className="box">
          <label>
            지갑 주소:
            <input
              type="text"
              className="maininput"
              placeholder="지갑 주소"
              onChange={(e) => setAddress(e.target.value)}
              value={address}
            />
          </label>
          <label>
            Private Key:
            <input
              type="text"
              className="maininput"
              placeholder="private key"
              onChange={(e) => setPrivateKey(e.target.value)}
              value={privateKey}
            />
          </label>
        </div>
      </div>
      <Link
        href={{
          pathname: "/token",
          query: {
            address: address,
            privateKey: privateKey,
          },
        }}
        className="link"
      >
        Coin/Token 바로가기{" "}
      </Link>
      <Link
        href={{
          pathname: "/nft",
          query: {
            address: address,
            privateKey: privateKey,
          },
        }}
        className="link"
      >
        NFT 바로가기{" "}
      </Link>
    </div>
  );
};

export default HomePage;
