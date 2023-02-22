import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "@config/erc20_abi.json";
import BackButton from "@/src/components/BackButton";
import { toast } from "react-toastify";
import { transLog } from "@/src/state";
import { useRecoilState } from "recoil";
import { useRouter } from "next/router";

const tokenContractInfo = [
  {
    symbol: "RB",
    name: "RobinToken",
    mainNetSymbol: "MATIC",
    mainNetName: "Polygon",
    contractAddr: "0x26027c8bF5a88ce523FFC0F7c1817780Ad519036",
    rpc: "https://polygon-rpc.com/",
    chainId: 137, // 0x504 in hex,
    scanURL: "https://polygonscan.com/",
  },
];

const providerRPC = [
  {
    symbol: "ETH",
    name: "Ethereum",
    rpc: "https://mainnet.infura.io/v3/3d2827df0a414597aa8643c91332f6b7", // Insert your RPC URL here
    chainId: 1, // 0x504 in hex,
    scanURL: "https://etherscan.io/",
  },
  {
    symbol: "BNB",
    name: "Binance",
    rpc: "https://bsc-dataseed.binance.org/", // Insert your RPC URL here
    chainId: 56, // 0x504 in hex,
    scanURL: "https://bscscan.com/",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    rpc: "https://polygon-rpc.com/", // Insert your RPC URL here
    chainId: 137, // 0x504 in hex,
    scanURL: "https://polygonscan.com/",
  },
];

const TokenPage = ({ data }) => {
  const router = useRouter();
  const myAddress = data?.address;
  const coinBalances = data?.coinBalances;
  const tokenBalances = data?.tokenBalances;
  const myPrivateKey = data?.privateKey;
  const [txLog, setTxLog] = useRecoilState(transLog);
  const [checkGasPrice, setGasPrice] = useState(0);
  const [sendAmount, setSendAmount] = useState(0);
  const [sendAddress, setSendAddress] = useState("");
  const [selectedInfo, setSelectedInfo] = useState("coin");
  const [selectedThing, setSelectedThing] = useState("");

  /*
   ** Gas 값 조회
   ** provider.getGasPrice()
   */

  const getGasPriceMethod = async () => {
    let _RPC =
      selectedInfo === "coin"
        ? providerRPC.find((e) => e.symbol === selectedThing)
        : tokenContractInfo.find((e) => e.symbol === selectedThing);

    if (selectedThing.length == 0 || selectedThing == "Token" || selectedThing == "Coin") {
      toast.warning("Coin/Token을 선택해주세요.");
      return;
    }
    let provider = new ethers.providers.JsonRpcProvider(_RPC?.rpc);

    setGasPrice("Loading...");

    try {
      const _gasPrice = await provider.getGasPrice();
      const res = ethers.utils.formatUnits(_gasPrice, "gwei");
      setGasPrice(parseInt(res));
    } catch (err) {
      console.log(err);
      toast.error("error");
    }
  };

  const handleTransfer = async () => {
    if (selectedThing.length == 0) {
      toast.warning("Coin/Token을 선택해주세요.");
      return;
    }

    let _RPC =
      selectedInfo === "coin"
        ? providerRPC.find((e) => e.symbol === selectedThing)
        : tokenContractInfo.find((e) => e.symbol === selectedThing);

    let provider = new ethers.providers.JsonRpcProvider(_RPC.rpc);

    const _gasPrice = await provider.getGasPrice();
    const gasPrice = ethers.utils.hexlify(parseInt(_gasPrice));

    /*
     ** Connect Wallet to net
     */
    const wallet = new ethers.Wallet(myPrivateKey);
    const walletSigner = wallet.connect(provider);

    if (selectedInfo == "token") {
      const tx = {
        from: myAddress,
        to: sendAddress,
        value: ethers.utils.parseUnits(sendAmount, 18),
        nonce: await provider.getTransactionCount(sendAddress, "latest"),
        //   gasLimit: ethers.utils.hexlify("0x100000"),
        gasLimit: 90000,
        gasPrice: gasPrice,
      };

      const tokenContract = new ethers.Contract(
        _RPC.contractAddr,
        ERC20ABI,
        walletSigner
      );

      try {
        // tokenContract
        //   .transfer(tx.to, tx.value, {
        //     gasLimit: tx.gasLimit,
        //     gasPrice: tx.gasPrice,
        //   })
        //   .then((transferResult) => {
        //     console.dir(transferResult);
        //     toast("sent token");
        //   });

        const createReceipt = await tokenContract.transfer(tx.to, tx.value, {
          gasLimit: tx.gasLimit,
          gasPrice: tx.gasPrice,
        });
        await createReceipt.wait();
        let recTmp = await provider.getTransactionReceipt(createReceipt.hash);

        let gasPriceGwei = ethers.utils.formatUnits(tx.gasPrice, "gwei");
        let gasPriceTotal = Math.round(
          parseFloat(recTmp.gasUsed) * parseFloat(gasPriceGwei)
        );

        let tmp = {
          ...createReceipt,
          receipt: recTmp,
          gas_price: gasPriceGwei,
          gas_limit: recTmp.gasUsed,
          gas_total: ethers.utils.formatUnits(gasPriceTotal, "gwei"),
        };

        // 로그 저장
        setTxLog(tmp);
        toast("이체 되었습니다.");
      } catch (err) {
        console.log(err);
        toast.error("error");
      }
    } else if (selectedInfo == "coin") {
      let coinTx = {
        to: sendAddress,
        value: ethers.utils.parseEther(sendAmount),
        nonce: provider.getTransactionCount(wallet.getAddress()),
        gasLimit: 25000,
        gasPrice: gasPrice,
      };

      try {
        let createReceipt = await walletSigner.sendTransaction(coinTx);
        await createReceipt.wait();

        let recTmp = await provider.getTransactionReceipt(createReceipt.hash);

        let gasPriceGwei = ethers.utils.formatUnits(coinTx.gasPrice, "gwei");
        let gasPriceTotal = Math.round(
          parseFloat(recTmp.gasUsed) * parseFloat(gasPriceGwei)
        );

        let tmp = {
          ...createReceipt,
          receipt: recTmp,
          gas_price: gasPriceGwei,
          gas_limit: recTmp.gasUsed,
          gas_total: ethers.utils.formatUnits(gasPriceTotal, "gwei"),
        };

        setTxLog(tmp);
        toast("이체 되었습니다.");
      } catch (err) {
        console.log(err);
        toast.error("error");
      }
    }
  };

  return (
    <div className="container">
      <BackButton />
      <div>
        <h2>Coin/Token 조회</h2>
        <h3>Coin 조회</h3>
        {coinBalances?.map((item, idx) => (
          <div className="box" key={idx}>
            <span>{item?.name} 잔액: </span>
            <span>{item?.balance}</span>
          </div>
        ))}
        <h3>Token 조회</h3>
        {tokenBalances?.map((item, idx) => (
          <div className="box" key={idx}>
            <span>{item?.name} 잔액: </span>
            <span>{item?.balance}</span>
          </div>
        ))}
      </div>
      <div className="addLine">
        <h2>Coin/Token 이체</h2>
        <p className="box"><b>Coin/Token 선택</b></p>
        <div>
          <input
            type="radio"
            name="type"
            value="coin"
            defaultChecked={true}
            onChange={(e) => {
              setSelectedThing("Coin");
              setSelectedInfo(e.target.value);
            }}
          />{" "}
          Coin
          <input
            type="radio"
            name="type"
            value="token"
            defaultChecked={false}
            onChange={(e) => {
              setSelectedThing("Token");
              setSelectedInfo(e.target.value);
            }}
          />{" "}
          Token
        </div>
        <div>
          <div className="box">
            {selectedInfo == "coin" ? (
              <select onClick={(e) => setSelectedThing(e.target.value)}>
                <option value="Coin">Coin</option>
                {providerRPC.map((item, idx) => (
                  <option key={idx} value={item.symbol}>
                    {item.symbol}
                  </option>
                ))}
              </select>
            ) : (
              <select onClick={(e) => setSelectedThing(e.target.value)}>
                <option value="Token">Token</option>
                {tokenContractInfo.map((item, idx) => (
                  <option key={idx} value={item.symbol}>
                    {item.symbol}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="box">
          <button className="basicButton chButton" onClick={getGasPriceMethod}>
            Gas Price 조회
          </button>
          <span className="box"> Gas Price: {checkGasPrice}</span>
        </div>

        <div className="mainBox">
          <p>
            <b>From: </b>
            {myAddress}
          </p>
          <div className="sendbox">
            <label>
              <b>To:</b>
              <input
                type="text"
                placeholder="이체할 주소"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
              />
            </label>
            <label>
              <b>수량:</b>
              <input
                type="number"
                placeholder="수량"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
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
          {/* <div>
            {txLog?.gasPrice && (
                <p><b>Total Gas Price:</b> <span>{txLog?.gas_total}</span></p>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TokenPage;

export async function getServerSideProps({ query }) {
  const myPrivateKey = query?.privateKey;
  const myAddress = query?.address;

  // Connect with Coin ========================================
  let coinBalances = [];
  for (let RPC of providerRPC) {
    const provider = new ethers.providers.StaticJsonRpcProvider(RPC.rpc, {
      chainId: RPC.chainId,
      name: RPC.name,
    });

    // ethers.utils.formatEther: wei를 10진수 문자열인 ether로 변환
    let val = await ethers.utils.formatEther(
      await provider.getBalance(myAddress)
    );
    coinBalances.push({
      symbol: RPC.symbol,
      name: RPC.name,
      scanURL: RPC.scanURL,
      balance: val,
    });
  }

  // Connect with Token =======================================

  let tokenBalances = [];
  for (let RPC of tokenContractInfo) {
  // 지갑 연결 =================================================

    /*
     ** provider : ethers 노드와 연결
     */

    const provider = new ethers.providers.StaticJsonRpcProvider(RPC.rpc, {
      chainId: RPC.chainId,
      name: RPC.mainNetName,
    });

    /*
     ** provider.getBlockNumber() : block number
     */
    const blockNumber = await provider.getBlockNumber();

    /*
     ** Wallet 연결 (예: META-MASK)
     ** ethers.Wallet(privateKey, provider)
     */
    const wallet = new ethers.Wallet(myPrivateKey, provider);

    /*
     ** Wallet 연결 + get Balance (예: META-MASK, get coin/token balance at wallet)
     ** provider.getBalance(address) : Get the balance of an account
     ** ethers.utils.formatEther(balance) : wei를 10진수 문자열인 ether로 변환
     */
    const balance = await ethers.utils.formatEther(
      await provider.getBalance(myAddress)
    );

    // 토큰 연결 ===========================================================

    /*
     ** Contract : Smart Contract (S.C) 연결
	 **            이더리움 네트워크 상의 특정한 컨트랙트와 연결하여 일반적인 js의 오브젝트처럼 사용
     ** ethers.Contract(token_contract_address, token_ABI, provider) : S.C에 연결
     */
    const tokenContract = new ethers.Contract(
      RPC.contractAddr,
      ERC20ABI,
      wallet
    );

    // Read-Only Methods =================================================

    /*
     ** Token 정보 읽기 - 필요한 경우 사용
     ** tokenContract.name() : token 이름
     ** tokenContract.symbol() : token 심볼
     ** tokenContract.balanceOf(address) : token balance (big_number)
     ** ethers.utils.formatUnits(balance, 18) : 18자리 변환 (wai -> ether)
     **
     */
    const tokenName = await tokenContract.name();
    const tokenSymbol = await tokenContract.symbol();
    // balanceOf 실행 -> 18자리 변환 (wai -> ether)
    const tokenBigNumber = await tokenContract.balanceOf(myAddress);
    const tokenBalance = ethers.utils.formatUnits(tokenBigNumber, 18);

    tokenBalances.push({
      symbol: tokenSymbol,
      name: tokenName,
      scanURL: RPC.scanURL,
      balance: tokenBalance,
    });
  }

  const res = {
    coinBalances: coinBalances,
    tokenBalances: tokenBalances,
    address: myAddress,
    privateKey: myPrivateKey,
  };

  return {
    props: { data: res },
  };
}
