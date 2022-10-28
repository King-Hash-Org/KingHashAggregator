// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.7;

interface ILidoInterface {
    function submit(address _referral) external payable returns (uint256 StETH);
}

interface ISTETH {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    function mint(uint256 _ethAmount, address _to) external returns (bool);
}

contract Lido is ILidoInterface, ISTETH {
    mapping(address => uint256) public _balances;

    // Records a deposit made by a user
    event Submitted(address indexed sender, uint256 amount, address referral);

    function submit(address _referral) external payable override returns (uint256) {
        address sender = msg.sender;
        uint256 deposit = msg.value;
        require(deposit != 0, "ZERO_DEPOSIT");
        require(sender != address(0), "MINT_TO_THE_ZERO_ADDRESS");
        // Mint stETH to user account
        uint256 sharesAmount = getSharesByPooledEth(deposit);
        _mintShares(msg.sender, sharesAmount);
        _submitted(sender, deposit, _referral);
        return sharesAmount;
    }

    function getSharesByPooledEth(uint256 deposit) internal pure returns (uint256) {
        return deposit;
    }

    function _submitted(address _sender, uint256 _value, address _referral ) internal {
        emit Submitted(_sender, _value, _referral);
    }

    function _mintShares(address _recipient, uint256 _sharesAmount) internal pure returns (uint256) {
        return _sharesAmount;
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0));
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function mint(uint256 _ethAmount, address _to) public virtual override returns (bool) {
        _balances[_to] += _ethAmount;
        return true;
    }
}
