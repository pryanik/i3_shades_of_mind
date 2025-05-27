    let munkData = [];

    fetch('colors_data.json')
    .then(response => response.json())
    .then(data => {
        munkData = data;
        initializeHistogramChart();
        initializeYearComparison();
    })
    .catch(error => {
        console.error("Can't download colors_data.json:", error);
    });

    const emotionalStateColors = {
      Тревожность: "#BE4D3A",
      Меланхолия: "#446A8E",
      Одиночество: "#5B7E5B",
      Созерцание: "#5B7E5B",
      Уязвимость: "#BE4D3A",
      Размышления: "#DBAD64",
      Спокойствие: "#A5C9CA",
      Воодушевление: "#DBAD64"
    };

    // Initializes the page once DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // initializeYearComparison();
    });

    // Histogram Chart Initialization
    function initializeHistogramChart() {
      const margin = { top: 40, right: 30, bottom: 60, left: 100 };
      const width = 1000;
      const height = 550;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select('#histogram-chart')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const chart = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // X scale for years
      const xScale = d3.scaleBand()
        .domain(munkData.map(d => d.year.toString()))
        .range([0, innerWidth])
        .padding(0.2);

      // Y scale for color frequency
      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      chart.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em') 
        .style('font-size', '15px');

      // Y axis
      chart.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '12px');

      // Y axis label
      chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -(innerHeight / 2))
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Процент цвета (%)');

      // For each year, creates a stacked bar group
      const yearGroups = chart.selectAll('.year-group')
        .data(munkData)
        .join('g')
        .attr('class', 'year-group')
        .attr('transform', d => `translate(${xScale(d.year.toString())},0)`);

      // For each year, adds stacked color bars
      yearGroups.each(function(d) {
        const group = d3.select(this);
        let yAccum = innerHeight;

        const totalFrequency = d.colorPalette.reduce((sum, c) => sum + c.frequency, 0);
        const normalizedPalette = d.colorPalette.map(c => ({
          color: c.color,
          percentage: (c.frequency / totalFrequency) * 100
        }));

        normalizedPalette.forEach((color, i) => {
          const barHeight = innerHeight - yScale(color.percentage);

          group.append('rect')
            .attr('x', 0)
            .attr('y', yAccum - barHeight)
            .attr('width', xScale.bandwidth())
            .attr('height', barHeight)
            .attr('fill', color.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 1);

          yAccum -= barHeight;
        });
      });

      // Interactivity
      yearGroups
        .on('mouseover', function(event, d) {
          const year = d.year;
          
          // Highlights the hovered year group
          d3.select(this).selectAll('rect')
            .attr('stroke-width', 2)
            .attr('stroke', '#000');
          
          displaySelectedYearInfo(d);
        })
        .on('mouseout', function() {
          // Resets style
          d3.select(this).selectAll('rect')
            .attr('stroke-width', 1)
            .attr('stroke', 'white');
        });
    }

    // Information about the selected year
    function displaySelectedYearInfo(yearData) {
      const selectedYearInfoEl = document.getElementById('selected-year-info');
      const defaultMessageEl = document.getElementById('default-message');
      
      // HTML for paintings
      let paintingsHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">';
      
      yearData.paintings.forEach(painting => {
        paintingsHTML += `
          <div class="bg-munk-cream rounded-lg shadow-lg overflow-hidden transition-transform hover:translate-y-[-5px] duration-300">
            <div class="relative aspect-[4/3] overflow-hidden">
              <img 
                src="${painting.imageUrl}" 
                alt="${painting.title}" 
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h4 class="text-xl font-serif font-bold mb-2">${painting.title}</h4>
              <p class="text-sm text-muted-foreground mb-3">${painting.year}</p>
              
              ${painting.description ? `<p class="text-sm mb-3">${painting.description}</p>` : ''}
              
              <div class="mb-4">
                <h5 class="text-sm font-semibold mb-2">Основные цвета:</h5>
                <div class="flex space-x-2">
                ${(() => {
                    const totalFrequency = painting.dominantColors.reduce((sum, c) => sum + c.frequency, 0);
                    return painting.dominantColors.map(color => {
                    const percent = ((color.frequency / totalFrequency) * 100).toFixed(1);

                    const width = Math.max(percent * 2, 10); 
                    return `
                        <div 
                        class="h-6 rounded-full tooltip-parent group relative"
                        style="background-color: ${color.color}; width: ${width}px"
                        >
                        <span class="tooltip absolute invisible group-hover:visible bg-black/75 text-white text-xs rounded px-2 py-1 bottom-full mb-1 left-1/2 transform -translate-x-1/2">
                            ${percent}%
                        </span>
                        </div>
                    `;
                    }).join('');
                })()}
                </div>
              </div>
              
              <div>
                <h5 class="text-sm font-semibold mb-2">Эмоциональное состояние:</h5>
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full" 
                    style="background-color: ${emotionalStateColors[painting.emotionalState.primary] || '#000'}"
                  ></div>
                  <span class="capitalize">${painting.emotionalState.primary}</span>

                </div>
                ${painting.emotionalState.notes ? `<p class="text-xs italic mt-2">${painting.emotionalState.notes}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      
      paintingsHTML += '</div>';
      
      // HTML for emotional analysis 
      const emotionHTML = `
        <div class="bg-munk-cream p-6 rounded-lg shadow">
          <h3 class="text-2xl font-bold mb-4">Анализ эмоций: ${yearData.year} год</h3>
          
          <div class="mb-6">
            <h4 class="text-lg font-medium mb-2">Эмоциональное состояние</h4>
            <div class="flex items-center gap-3">
              <div 
                class="w-8 h-8 rounded-full" 
                style="background-color: ${emotionalStateColors[yearData.averageEmotionalState.primary] || '#888'}"
              ></div>
              <div>
                <span class="text-xl capitalize">${yearData.averageEmotionalState.primary}</span>
                <span class="text-sm text-muted-foreground ml-2">
                  
                </span>
              </div>
            </div>
            ${yearData.averageEmotionalState.notes ? 
              `<p class="mt-2">${yearData.averageEmotionalState.notes}</p>` : 
              ''
            }
          </div>
          
          <div>
            <h4 class="text-lg font-medium mb-2">Анализ цветовой палитры</h4>
            <div class="flex h-12 w-full overflow-hidden rounded-md">
              ${yearData.colorPalette.map(color => `
                <div 
                  class="h-full tooltip-parent group relative" 
                  style="background-color: ${color.color}; width: ${color.frequency}%"
                >
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      // Updates the DOM
      selectedYearInfoEl.innerHTML = `
        <h3 class="text-2xl font-bold mb-6 text-center">Картины за ${yearData.year}</h3>
        ${paintingsHTML}
        ${emotionHTML}
      `;
      
      // Shows selected year info, hides default message
      selectedYearInfoEl.classList.remove('hidden');
      defaultMessageEl.classList.add('hidden');
    }

    // Year Comparison Initialization
    function initializeYearComparison() {
      const firstYearSelect = document.getElementById('first-year-select');
      const secondYearSelect = document.getElementById('second-year-select');
      
      // Adds years to select dropdowns
      munkData.forEach(yearData => {
        const year = yearData.year.toString();
        
        const firstOption = document.createElement('option');
        firstOption.value = year;
        firstOption.textContent = year;
        
        const secondOption = document.createElement('option');
        secondOption.value = year;
        secondOption.textContent = year;
        
        firstYearSelect.appendChild(firstOption);
        secondYearSelect.appendChild(secondOption);
      });
      
      // Sets default selections (first and last years)
      firstYearSelect.value = munkData[0].year.toString();
      secondYearSelect.value = munkData[munkData.length - 1].year.toString();
      
      // Displays initial palettes
      updateYearPalette('first', munkData[0]);
      updateYearPalette('second', munkData[munkData.length - 1]);
      
      // Adds event listeners
      firstYearSelect.addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        const yearData = munkData.find(d => d.year.toString() === selectedYear);
        if (yearData) {
          updateYearPalette('first', yearData);
        }
      });
      
      secondYearSelect.addEventListener('change', (e) => {
        const selectedYear = e.target.value;
        const yearData = munkData.find(d => d.year.toString() === selectedYear);
        if (yearData) {
          updateYearPalette('second', yearData);
        }
      });
    }

    // Updates the year palette display
    function updateYearPalette(position, yearData) {
      const paletteEl = document.getElementById(`${position}-year-palette`);
      
      paletteEl.innerHTML = `
        <h3 class="text-2xl font-serif mb-4 text-center">
          ${yearData.year}
        </h3>
        
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h4 class="text-lg font-medium">Цветовая палитра</h4>
            <div class="flex h-16 w-full overflow-hidden rounded-md border">
              ${yearData.colorPalette.map((color, index) => `
                <div 
                  class="h-full tooltip-parent group relative"
                  style="background-color: ${color.color}; width: ${color.frequency}%"
                >
                  <div class="absolute invisible group-hover:visible bg-black/75 text-white text-xs rounded px-2 py-1 bottom-full mb-1 left-1/2 transform -translate-x-1/2">
                    ${color.frequency}%
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="flex flex-col gap-2">
            <h4 class="text-lg font-medium">Эмоциональное состояние</h4>
            <div class="flex items-center gap-3">
              <div 
                class="w-6 h-6 rounded-full" 
                style="background-color: ${emotionalStateColors[yearData.averageEmotionalState.primary] || '#888'}"
              ></div>
              <div>
                <span class="capitalize">${yearData.averageEmotionalState.primary}</span>
                <span class="text-sm text-muted-foreground ml-2">

                </span>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-2">
            <h4 class="text-lg font-medium">Количество картин</h4>
            <p>${yearData.paintings.length}</p>
          </div>
        </div>
      `;
    }