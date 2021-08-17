// embark plugin to use eth-contract-class

module.exports = Embark => {
  Embark.events.on('runcode:ready', () => {
    Embark.events.emit('runcode:register', 'generateClass', require('eth-contract-class'), () => {
      Embark.registerTestContractFactory(function testContractFactory(contractRecipe, web3) {
        if (!contractRecipe.code) return null;
        const generateClass = require('eth-contract-class').default;
        const ContractClass = generateClass(contractRecipe.abiDefinition, contractRecipe.code);
        const contract = new ContractClass(web3, contractRecipe.deployedAddress);

        contract.$runtimeByteCode = '0x' + contractRecipe.runtimeBytecode;

        // embark creates a empty Object for contracts when using embark.require('Embark/contracts/*')
        // then uses Object.setPrototypeOf(contractObject, contractFactoryResult) to "populate" the
        // object. Unfortunately this will ensure that the contract instance is not callable directly
        // so we instantiate the contract instance here & return the object.
        // we provide the `.at` function here so we can provide a way to get a new Contract instance
        return Object.assign(contract, {
          new: (...args) => ContractClass.new(web3, ...args),
          at: address => new ContractClass(web3, address),
        });
      });
      Embark.registerCustomContractGenerator(contract => {
        return `
        ${contract.className} = generateClass(${JSON.stringify(contract.abiDefinition)}, '${
          contract.code
        }');
        ${contract.className}Instance = new ${contract.className}(web3, '${
          contract.deployedAddress
        }');
        `;
      });
    });
  });
};
