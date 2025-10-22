export default {
  getOptions() {
    const data = Qry_PontuacaoDominio.data || [];

    // Build arrays for X-axis (dominio) and Y-axis (pontuacao)
    const xAxisData = data.map(row => row.dominio);
    const seriesData = data.map(row => row.pontuacao);

    return {
      title: {
        text: 'Pontuação por Domínio',
        left: 'center',
        top: 10,
        textStyle: { fontSize: 20, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { containLabel: true, bottom: 60, top: 80 },
      xAxis: {
        type: 'category',
        data: xAxisData,
        name: 'Domínio',
        nameLocation: 'middle',
        nameGap: 40
      },
      yAxis: {
        type: 'value',
        name: 'Pontuação (%)',
        min: 0,
        max: 100
      },
      series: [
        {
          type: 'bar',
          data: seriesData,
          itemStyle: { color: '#65B581' },
          barWidth: '50%',
					label: {
            show: true,
            position: 'top',      
            formatter: '{c}%',   
            fontSize: 10,
            color: '#808080'
          }
        }
      ]
    };
  }
};
