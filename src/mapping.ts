import { Transfer } from "../generated/SWCapital/SWCapital";
import {
  SWCUser,
  Token,
  TokenBalance,
  Transaction,
  TransactionReceipt,
} from "../generated/schema";
import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";

// Every transfer amount to an updated transaction and tokenbalance state
export function handleTransfer(event: Transfer): void {
  // User is from or to, depending on sell/buy action
  // Sell - user if from
  let user = SWCUser.load(event.params.from.toHex());
  // Buy - user is to
  if (!user) {
    user = SWCUser.load(event.params.to.toHex());
  }
  // New user - incoming funds
  if (!user) {
    user = new SWCUser(event.params.to.toHex());
    user.address = event.params.to;
  }

  // Store event for tx overview
  let transactionReceipt = TransactionReceipt.load(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  if (!transactionReceipt) {
    transactionReceipt = new TransactionReceipt(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    transactionReceipt.from = event.params.from;
    transactionReceipt.to = event.params.to;
    transactionReceipt.value = event.params.value;
    transactionReceipt.token = event.address.toHex();
  }

  // Create transaction
  let transaction = Transaction.load(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  if (!transaction) {
    transaction = new Transaction(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    transaction.user = user.id;
    transaction.transactionReceipt = transactionReceipt.id;
  }

  transactionReceipt.transaction = transaction.id;

  // Does the token exist?
  let token = Token.load(event.address.toHex());
  if (!token) {
    token = new Token(event.address.toHex());
    token.address = event.address;
    token.save();
  }

  // Update sender balance
  let tokenBalanceUser = TokenBalance.load(
    user.id + "-" + event.address.toHex()
  );
  if (!tokenBalanceUser) {
    tokenBalanceUser = new TokenBalance(user.id + "-" + event.address.toHex());
    tokenBalanceUser.user = user.id;
    tokenBalanceUser.token = token.id;
    tokenBalanceUser.balance = event.params.value;
  } else if (user.address === event.params.from) {
    tokenBalanceUser.balance = tokenBalanceUser.balance.minus(
      event.params.value
    );
  } else if (user.address === event.params.to) {
    tokenBalanceUser.balance = tokenBalanceUser.balance.plus(
      event.params.value
    );
  }

  user.save();
  transactionReceipt.save();
  transaction.save();
  tokenBalanceUser.save();
}

export function createTransferEvent(
  id: string,
  from: string,
  to: string,
  value: BigInt
): Transfer {
  let mockEvent = newMockEvent();
  let transferEvent = new Transfer(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );
  transferEvent.parameters = new Array();

  let fromParam = new ethereum.EventParam(
    "from",
    ethereum.Value.fromAddress(Address.fromString(from))
  );
  let toParam = new ethereum.EventParam(
    "to",
    ethereum.Value.fromAddress(Address.fromString(to))
  );
  let valueParam = new ethereum.EventParam(
    "value",
    ethereum.Value.fromUnsignedBigInt(value)
  );

  transferEvent.parameters.push(fromParam);
  transferEvent.parameters.push(toParam);
  transferEvent.parameters.push(valueParam);

  return transferEvent;
}
