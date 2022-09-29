// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {


    //find the usd corresponding to wei
    function price() internal view returns(uint256) {
        AggregatorV3Interface pricefeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);
         (
            /*uint80 roundID*/,
            int256 ethval,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = pricefeed.latestRoundData();
        return uint256(ethval);
    }

    function weitousd(uint weis) internal view returns (uint256) {
        uint256 ethval = price();
        uint256 inusd = (weis * ethval) / 1e26 ;
        return inusd;
    }


}