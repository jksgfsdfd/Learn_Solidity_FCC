// SPDX-License-Identifier: MIT
pragma solidity 0.8.8; //set the compiler version

import "./Customers.sol";

contract create_customer_contract {

    Customers[] customer_contract_list;

    function create() public {
        Customers customer_contract = new Customers();
        customer_contract_list.push(customer_contract);
    }

    function view_contract_deployed(uint index) public view returns (Customers) {
            return customer_contract_list[index];
    } 

    function add_customer_in_contract(uint contract_index,string memory name,int balance) public virtual {
        Customers customer_contract = customer_contract_list[contract_index];
        customer_contract.add_customer(name,balance);
    }

    function view_contract_count(uint index) public view returns (uint){
        Customers  customer_contract = customer_contract_list[index];
        return customer_contract.view_count();
    }

    function view_contract_balance (uint index,string memory name) public view returns (int){
            Customers customer_contract = customer_contract_list [index];
            return customer_contract.name_to_balance(name);
    }
}