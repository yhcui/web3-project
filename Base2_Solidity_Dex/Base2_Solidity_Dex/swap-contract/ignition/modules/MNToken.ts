import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MNTokenModule = buildModule("MNToken", (m) => {
  const MNTokenA = m.contract("MNToken", ["MetaNode Token A", "MNTA"], {
    id: "MNTokenA",
  });
  const MNTokenB = m.contract("MNToken", ["MetaNode Token B", "MNTB"], {
    id: "MNTokenB",
  });
  const MNTokenC = m.contract("MNToken", ["MetaNode Token C", "MNTC"], {
    id: "MNTokenC",
  });
  const MNTokenD = m.contract("MNToken", ["MetaNode Token D", "MNTD"], {
    id: "MNTokenD",
  });

  return {
    MNTokenA,
    MNTokenB,
    MNTokenC,
    MNTokenD,
  };
});

export default MNTokenModule;
