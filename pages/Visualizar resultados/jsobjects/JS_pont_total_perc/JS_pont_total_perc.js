export default {
  combinarPontuacoes: () => {
    const cert = Qry_get_p_cert.data || [];
    const resp = Qry_get_p_resp.data || [];
    const maxPont = Qry_get_p_potenc.data || [];

    let somaAtual = 0;
    let somaMaxima = 0;

    // Soma das pontuações atuais
    cert.forEach(item => {
      somaAtual += Number(item.pontuacao_t_cert) || 0;
    });

    resp.forEach(item => {
      somaAtual += Number(item.pontuacao_t_resp) || 0;
    });

    // Soma das pontuações máximas
    maxPont.forEach(item => {
      somaMaxima += Number(item.table_t_potencial) || 0;
    });

    // Calcular percentagem total
    const percentagemTotal = somaMaxima > 0 ? (somaAtual / somaMaxima) * 100 : 0;

    return {
      valor: Number(percentagemTotal.toFixed(2)), // para a barra
      label: `${percentagemTotal.toFixed(2)}%`    // texto opcional
    };
  }
};