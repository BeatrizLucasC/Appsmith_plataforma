export default {
  options: {
    title: {
      text: 'Pontuação por Dimensão',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#000'
      }
    },
    dataset: {
      source: [
        ['Score (%)', 'Category'],
        [89.3, 'Água'],
        [57.1, 'Solos'],
        [74.4, 'Condições de trabalho'],
        [50.1, 'Criação de valor'],
        [89.7, 'Energia e resíduos'],
        [68.1, 'Gestão de pragas e doenças'],
        [19.6, 'Impacto local'],
        [10.6, 'Produção'],
        [32.7, 'Serviços dos ecossistemas e biodiversidade']
      ]
    },
    grid: { containLabel: true },
    xAxis: { 
      name: 'Pontuação (%)',
      nameLocation: 'middle',  
      nameGap: 30              
    },
    yAxis: { type: 'category' },
    visualMap: {
      orient: 'horizontal',
      left: 'center',
      min: 10,
      max: 100,
      text: ['High Score', 'Low Score'],
      dimension: 0,
      inRange: {
        color: ['#FD665F', '#FFCE34', '#65B581']
      }
    },
    series: [
      {
        type: 'bar',
        encode: {
          x: 'Score (%)',
          y: 'Category'
        }
      }
    ]
  }
};


