export const ENSMock = async () => {
  return {
    getText: async () => {
      return "healthbot_31337_1";
    },
  };
};
