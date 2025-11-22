Feature: Royalties Registry Permissioned No Allow

  Scenario: ERC721 without royalties interface not allowed
    Given I have the deployed royalties registry and exchange
    And I deploy an ERC721 contract
    And I mint a token to seller
    Then getRoyalties should return empty array
    And I can trade without royalties