export default {
  async init() {
    await Qry_years.run(); // 1) carrega anos
    // (opcional) força o Select a ficar com o 1º ano, caso necessário:
    await Select_year.setSelectedOption(Qry_years.data[0]?.ano?.toString());
    await Qry_dadosIniciais.run(); // 2) só agora corre a principal
  }
};
