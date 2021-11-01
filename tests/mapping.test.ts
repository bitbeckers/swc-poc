import { Transfer } from "../generated/SWCapital/SWCapital";
import {
  SWCUser,
  Token,
  TokenBalance,
  Transaction,
  TransactionReceipt,
} from "../generated/schema";
import {
  clearStore,
  test,
  assert,
  newMockEvent,
} from "matchstick-as/assembly/index";
import { Address, Value, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { handleTransfer, createTransferEvent } from "../src/mapping";

test("Create SWCUser", () => {
  let customUser = new SWCUser("434");
  customUser.set(
    "address",
    Value.fromAddress(
      Address.fromString("0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91")
    )
  );

  customUser.save();

  assert.fieldEquals(
    "SWCUser",
    "434",
    "address",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase()
  );

  clearStore();
});

test("Handle Transfer", () => {
  // Initialise event (this can be generalised into a separate function)
  let firstTransfer = createTransferEvent(
    "first",
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91",
    new BigInt(10)
  );
  let secondTransfer = createTransferEvent(
    "second",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91",
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    new BigInt(55)
  );

  // Call mappings
  handleTransfer(firstTransfer);
  handleTransfer(secondTransfer);
  // Assert the state of the store
  // User exists
  assert.fieldEquals(
    "SWCUser",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase(),
    "address",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase()
  );

  //Tx Receipt

  const transactionReceiptId =
    firstTransfer.transaction.hash.toHex() +
    "-" +
    firstTransfer.logIndex.toString();
  assert.fieldEquals(
    "TransactionReceipt",
    transactionReceiptId,
    "from",
    "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7".toLowerCase()
  );
  assert.fieldEquals(
    "TransactionReceipt",
    transactionReceiptId,
    "to",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase()
  );
  assert.fieldEquals(
    "TransactionReceipt",
    transactionReceiptId,
    "value",
    new BigInt(10).toString()
  );


  // Tx

  const transactionId =
    firstTransfer.transaction.hash.toHex() +
    "-" +
    firstTransfer.logIndex.toString();

  assert.fieldEquals(
    "Transaction",
    transactionId,
    "user",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase()
  );

  assert.fieldEquals(
    "Transaction",
    transactionId,
    "transactionReceipt",
    transactionReceiptId
  );

  // Token
  const tokenId = firstTransfer.address.toHex();
  assert.fieldEquals("Token", tokenId, "address", tokenId);

  // TokenBalance
  const tokenBalanceId =
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase() +
    "-" +
    firstTransfer.address.toHex();

  assert.fieldEquals(
    "TokenBalance",
    tokenBalanceId,
    "user",
    "0x6E4f821eD0a4a99Fc0061FCE01246490505Ddc91".toLowerCase()
  );
  assert.fieldEquals(
    "TokenBalance",
    tokenBalanceId,
    "token",
    tokenId
  );  
  assert.fieldEquals(
    "TokenBalance",
    tokenBalanceId,
    "balance",
    new BigInt(10).toString()
  );

  // Clear the store before the next test (optional)
  clearStore();
});
