export default {
  combinarPontuacoes: () => {
    const cert = Qry_get_p_cert.data || [];
    const resp = Qry_get_p_resp.data || [];
    const maxPont = Qry_get_p_potenc.data || [];

    const resultado = {};

    // Soma das pontuações atuais
    cert.forEach(item => {
      const valor = Number(item.pontuacao_t_cert) || 0;
      resultado[item.dominio] = (resultado[item.dominio] || 0) + valor;
    });

    resp.forEach(item => {
      const valor = Number(item.pontuacao_t_resp) || 0;
      resultado[item.dominio] = (resultado[item.dominio] || 0) + valor;
    });

    // Criar mapa com pontuação máxima
    const maxPorDominio = {};
    maxPont.forEach(item => {
      maxPorDominio[item.dominio] = Number(item.table_t_potencial) || 0;
    });

    // Filtro dinâmico pelo Select1
    return Object.keys(resultado)
      .filter(dominio => dominio === Tabs1.selectedTab) // usa valor do Select1
      .map(dominio => {
        const total = resultado[dominio];
        const max = maxPorDominio[dominio] || 0;
        const percentagem = max > 0 ? (total / max) * 100 : 0;

        return {
          x: dominio,
          y: percentagem.toFixed(2),
        };
      });
  }
};