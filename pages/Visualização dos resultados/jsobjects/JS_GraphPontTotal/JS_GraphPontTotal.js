export default {
  getOptions() {
    const value =
      (Qry_PontuacaoTotal.data &&
        Qry_PontuacaoTotal.data[0] &&
        Qry_PontuacaoTotal.data[0].pontuacao_media) ||
      0;

    return {
      title: {
        text: 'Pontuação global',
        left: 'center',
        top: 0, // Increased distance from top
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
					color: '#000'
        }
      },
      tooltip: {
        formatter: '{a} <br/>{b}: {c}%'
      },
      series: [
        {
          name: 'Pontuação Total',
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          progress: {
            show: true,
            width: 18
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [
                [0.25, '#FD665F'],   // Red up to 25%
                [0.5, '#FFCE34'],    // Yellow up to 50%
                [1, '#65B581']       // Green up to 100%
              ]
            }
          },
          axisTick: {
            show: true // hides ticks
          },
          splitLine: {
            show: false // hides split lines
          },
          axisLabel: {
            show: false // hides numeric labels
          },
          pointer: {
            show: true
          },
          anchor: {
            show: false
          },
          title: {
            show: false
          },
          detail: {
            offsetCenter: [0, '60%'], // moves value lower down
            valueAnimation: true,
            formatter: '{value}%',
            fontSize: 30,
            color: '#65B581'
          },
          data: [
            {
              value: value,
              name: 'Pontuação'
            }
          ]
        }
      ]
    };
  }
};


