// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./PriceConverter.sol";

error NotOwner();

contract fundMe {
    using PriceConverter for uint256;

    address immutable owner ;

    constructor(){
        owner = msg.sender;
    }

    uint256 constant minusd = 50;
    address[] public funders;
    mapping (address => uint256) public addresstoFund;

    function fund() public payable {
        //msg.value is in wei
        require((msg.value).weitousd() > minusd , "fund a minimum of 50USD");

        funders.push(msg.sender);
        addresstoFund[msg.sender] += msg.value;
    }

    

    function withdraw() public onlyOwner {

        
        //send funds to the owner
        for(uint i = 0 ; i < funders.length ; i++){
            addresstoFund[funders[i]] = 0;
        }

        funders = new address[](0);

        //using transfer send and call
        //payable(owner).transfer(address(this).balance);
        //bool sendSuccess = payable(owner).send(address(this).balance);
        ///require(sendSuccess, "Send failed");

        (bool callSuccess, ) = payable(owner).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    modifier onlyOwner {
        //
        //require(msg.sender == owner , "Only owner can perform this action");
        if(msg.sender != owner){
            revert NotOwner();
        }
        _;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
    
}