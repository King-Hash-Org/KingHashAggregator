// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../controller-interface/ISwellController.sol";
import "../interfaces/ISwell.sol";

/** @title Router for Swell Strategy
  * @author ChainUp Dev
  * @dev Routes incoming data(Swell strategy) to outbound contracts 
**/
contract SwellRouter is Initializable { 

    ISwell public swellContract;
    ISwellController public swellController;

    
}