export default {
  options: {
    title: {
      text: 'Pontuação indicadores',
      left: 'Letf'
    },
    grid: {
      bottom: 100 // increase bottom margin to fit multi-line labels
    },
    xAxis: {
      type: 'category',
      data: [
        'Gestão de energia',
        'Consumo e eficiência',
        'Tarifário',
        'Sensibilização',
        'Energias renováveis',
        'Plano gestão resíduos',
        'Gestão de resíduos'
      ],
      axisLabel: {
        interval: 0, // show all labels
        formatter: function(value) {
          // Split into words and join with newline
          return value.split(' ').join('\n');
        }
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Valores',
        data: [30, 20, 15, 80, 70, 61, 31],
        type: 'bar',
        label: {
          show: true,
          position: 'top'
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    }
  }
};


