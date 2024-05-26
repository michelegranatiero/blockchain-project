// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract Rewards {
    uint workersPerRound;
    uint[] rewards;
    uint bounty;
    uint[][] local_rankings;
    uint[] global_ranking;

    constructor(uint[][] memory _local_rankings, uint _bounty) {
        local_rankings = _local_rankings;
        workersPerRound = local_rankings.length;
        bounty = _bounty;
    }   

    function computeRewards() public {

        for (uint i = 0; i < workersPerRound; i ++) {
            for (uint j = 0; j < workersPerRound; j++) {
                global_ranking[j] += local_rankings[i][j];
            }
        }

        uint[] memory median_ranking = new uint[](workersPerRound);
        for (uint i = 0; i < workersPerRound; i ++) {
            median_ranking[i] = global_ranking[i] / workersPerRound;
        }

        uint[][] memory local_variations = new uint[][](workersPerRound);
        for (uint i = 0; i < workersPerRound; i ++) {
            local_variations[i] = new uint[](workersPerRound);
            for (uint j = 0; j < workersPerRound; j++) {
                local_variations[i][j] = (local_rankings[i][j] - median_ranking[i])**2;
            }
        }

        uint tot_score = 0;
        uint[] memory variation_score = new uint[](workersPerRound);
        for (uint i = 0; i < workersPerRound; i ++) {
            uint score = 0;
            for (uint j = 0; j < workersPerRound; j ++) {
                score += local_variations[i][j];
            }
            variation_score[i] = 10000/score;
            tot_score += variation_score[i];
        }

        for (uint i = 0; i < workersPerRound; i ++) {
            uint coefficient = variation_score[i]/tot_score;
            rewards[i] = bounty * coefficient;
        }
    }

    function getRewards() public view returns (uint[] memory) {
        return rewards;
    }   
}