export default {
  options: {
    title: {
        text: 'Pontuação por domínio',
        left: 'center',
        top: 0, // Increased distance from top
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
					color: '#000'
        },
    dataset: {
      source: (() => {
        const data = Qry_PontuacaoDominio.data || [];
        return [['Pontuação (%)', 'Domínio'], ...data.map(d => [d.pontuacao, d.dominio])];
      })()
    },
    grid: { containLabel: true },
    xAxis: { name: 'Pontuação (%)', nameLocation: 'middle', nameGap: 30 },
    yAxis: { type: 'category' },
    visualMap: {
      orient: 'horizontal',
      left: 'center',
      min: 10,
      max: 100,
      text: ['High', 'Low'],
      dimension: 0,
      inRange: { color: ['#FD665F', '#FFCE34', '#65B581'] }
    },
    series: [
      {
        type: 'bar',
        encode: { x: 'Pontuação (%)', y: 'Domínio' },
        label: { show: true, position: 'right', formatter: '{@[0]}%' }
      }
    ]
  }
};
