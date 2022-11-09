// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract KEth is ERC20Upgradeable {
    uint256 public kethSupply;
    uint256 public totalEthBalance;

    // Events
    // event EtherDeposited(address indexed from, uint256 amount, uint256 time);
    // event TokensMinted(address indexed to, uint256 amount, uint256 ethAmount, uint256 time);
    // event TokensBurned(address indexed from, uint256 amount, uint256 ethAmount, uint256 time);

    // function initalize()  initializer  public{
    //     __ERC20_init("kETH", "King Ether");
    //     _mint(_msgSender(), 10000000000000000000000);
    // }

    function getKethValue(uint256 _ethAmount) public view returns (uint256) {
        // Get network balances
        // Use 1:1 ratio if no rETH is minted
        if (kethSupply == 0) {
            return _ethAmount;
        }
        // Check network ETH balance
        require(totalEthBalance > 0, "Cannot calculate kETH token amount while total network balance is zero");
        // Calculate and return
        return (_ethAmount * kethSupply) / totalEthBalance;
    }

    function _mintKETH(address _recipient, uint256 _kEthAmount) internal returns (bool) {
        require(_recipient != address(0), "MINT_TO_THE_ZERO_ADDRESS");
        _mint(_recipient, _kEthAmount);
        return true;
    }
}
