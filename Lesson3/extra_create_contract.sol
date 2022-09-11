// SPDX-License-Identifier: MIT
pragma solidity 0.8.8; //set the compiler version

import "./create_customer_contract.sol";

contract extra_create_contract is create_customer_contract {
    function add_customer_in_contract(uint contract_index,string memory name,int balance) public override {
        Customers customer_contract = customer_contract_list[contract_index];
        customer_contract.add_customer(name,balance+100);
    }
}