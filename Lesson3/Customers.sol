// SPDX-License-Identifier: MIT
pragma solidity 0.8.8; //set the compiler version

contract Customers{

    uint256 public customer_count;
    customer[] public customers;
    mapping (string => int) public name_to_balance;

    struct customer{
        uint256 id;
        string name;
        int balance;
    } 


    //data location must be specified for string 
    function add_customer(string memory name,int balance) public {
        uint id=customer_count;
        customer_count = customer_count + 1;
        customers.push(customer(id,name,balance));
        name_to_balance[name] = balance;
    }

    //view and pure doesnt change blockchain state and hence cost no gas
     function view_count() public view returns (uint256) {
         return customer_count;
     } 
}