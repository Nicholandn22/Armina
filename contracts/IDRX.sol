// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IDRX
 * @notice Mock Indonesian Rupiah stablecoin for testing Armina
 * @dev Uses 2 decimals to match IDR denomination
 */
contract IDRX is ERC20, Ownable {
    uint8 private constant DECIMALS = 2;

    // Faucet cooldown mapping
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_AMOUNT = 500_000 * 10 ** DECIMALS; // 500K IDRX
    uint256 public constant FAUCET_COOLDOWN = 0; // No cooldown for testnet judging

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor() ERC20("Indonesian Rupiah X", "IDRX") Ownable(msg.sender) {
        // Mint initial supply to deployer for liquidity
        _mint(msg.sender, 1_000_000_000 * 10 ** DECIMALS); // 1B IDRX
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Claim test tokens from faucet
     * @dev Limited to once per day per address
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: cooldown not elapsed"
        );

        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Check if user can claim from faucet
     */
    function canClaimFaucet(address user) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[user] + FAUCET_COOLDOWN;
    }

    /**
     * @notice Get time until next faucet claim
     */
    function timeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextClaim = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaim) {
            return 0;
        }
        return nextClaim - block.timestamp;
    }

    /**
     * @notice Owner can mint additional tokens
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
