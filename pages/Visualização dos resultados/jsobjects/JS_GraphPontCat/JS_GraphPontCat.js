export default {
  options: {
    title: {
      text: 'Pontuação por categoria',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000'
      }
    },
    dataset: {
      source: (() => {
        const data = Qry_PontuacaoCategoria.data || [];
        if (!data.length) {
          return [['Score (%)', 'Category']];
        }

        // Transform query results into ECharts dataset format
        const formatted = data.map(row => [row.pontuacao, row.categoria]);

        // Add header row
        return [['Score (%)', 'Category'], ...formatted];
      })()
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
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{@[0]}%'  // show % value on bars
        }
      }
    ]
  }
};



