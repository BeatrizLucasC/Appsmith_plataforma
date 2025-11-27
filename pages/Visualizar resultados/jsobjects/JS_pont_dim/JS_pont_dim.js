export default {
  combinarPontuacoes: () => {
    const cert = Qry_get_p_cert.data || [];
    const resp = Qry_get_p_resp.data || [];

    const resultado = {};

    cert.forEach(item => {
      const valor = Number(item.pontuacao_t_cert) || 0;
      resultado[item.dominio] = (resultado[item.dominio] || 0) + valor;
    });

    resp.forEach(item => {
      const valor = Number(item.pontuacao_resposta) || 0;
      resultado[item.dominio] = (resultado[item.dominio] || 0) + valor;
    });

    return Object.keys(resultado).map(dominio => ({
      x: dominio,
      y: resultado[dominio] // agora garantidamente número
    }));
  }
};