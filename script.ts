import fs from "fs";
const csv = require('csv-parser');
let results: any = [];

const param = (p: string):string => {
    const index: number = process.argv.indexOf(p) || 0;
    if(index > 0){
        return process.argv[index + 1];
    }
    return '';
}

let fecha = param('--date')

const csvRead = () => {
    try {
        // leyendo archivo csv
        fs.createReadStream('time_series_covid19_deaths_US.csv')
            .pipe(csv({
                delimiter: ',',
                cast: true,
                comment: '#'
            }))
            .on('data', (data: any) => {
                // guardando los datos del CSV a la variable result
                results.push(data);
            })
            .on('end', () => {
                // objeto donde se guardaran las provincias
                let provinces: any = {};
                const filter = results.filter((result: any) => {
                    if(result.Province_State == 'American Samoa'){
                        // console.log(result);
                    }
                    result.Province_State == 'Alabama'
                });
                //Recorriendo el array con los resultados del CSV
                results.forEach((result: any) => {
                    // Determinando fecha a buscar
                    // obteniendo ultima fecha registrada
                    let datelast: any = Object.entries(result).pop();
                    // obteniendo fecha digitando por el usuario
                    if(fecha.length > 0 && Date.parse(fecha)){
                        datelast = [fecha];
                    }
                    fecha = datelast[0]
                    //Guardando Admin2 por su provincia
                    if(!provinces[result.Province_State]){
                        const date: any = {};
                        date.Admin2 = result.Admin2;
                        date[datelast[0]] = result[datelast[0]]
                        date.Population = result.Population
                        provinces[result.Province_State] = [date];
                    }else{
                        const date: any = {};
                        date.Admin2 = result.Admin2;
                        date[datelast[0]] = result[datelast[0]]
                        date.Population = result.Population
                        provinces[result.Province_State].push(date);
                    }
                });

                // obteniendo datos [totalHabitantes, totalAcumulado,porcentajeMuertes]
                const acomulado: any = [] ;
                for (const province in provinces) {
                    const sumaMuertes: number = provinces[province].reduce((acum: number,province: any):number => {
                        return acum + parseInt(province[fecha]);
                    },0);
                    const sumaPoblacion: number = provinces[province].reduce((acum: number,province: any):number => {
                        return acum + parseInt(province.Population);
                    },0);
                    const porcentaje: number = ((sumaMuertes * 100) / sumaPoblacion);
                    acomulado.push({
                        province,
                        acomulado: sumaMuertes,
                        habitantes: sumaPoblacion,
                        porcentaje: (sumaMuertes >= 0 && sumaPoblacion > 0) ? porcentaje : 0
                    })
                }
                acomulado.sort((a: any,b: any) => a.acomulado - b.acomulado);
                const ordenAcumulado = acomulado;
                acomulado.sort((a: any,b: any) => a.porcentaje - b.porcentaje);
                const ordenPorcentaje = acomulado;
                console.log('------------------------------------------------------');
                console.log(`Estado con mayor acumulado a la fecha [${fecha}]: El estado de ${ordenAcumulado[ordenAcumulado.length - 1].province} con un total de ${ordenAcumulado[ordenAcumulado.length - 1].acomulado} muertes por covid \n`);
                console.log('------------------------------------------------------');
                console.log(`Estado con menor acumulado a la fecha [${fecha}]: El estado de ${ordenAcumulado[0].province} con un total de ${ordenAcumulado[0].acomulado} muertes por covid \n`);
                console.log('------------------------------------------------------');
                console.log('El porcentaje de muertes vs el total de la poblacion por estado:\n');
                ordenPorcentaje.forEach((estado: any,index:number) =>{
                    console.log(`${index + 1}. El estado ${estado.province} con una poblacion de ${estado.habitantes} habitantes tuvo un total de muertes por covid hasta la fecha ${fecha} de ${estado.acomulado}. El porcentaje de muertes sobre habitantes de este estado es del ${estado.porcentaje}%\n`);
                });
                console.log('------------------------------------------------------');
                console.log(`Cual fue el estado mas afectado:`);
                console.log(`• Si se habla por el estado con la mayor cantidad de muertes por Covid19 seria ${ordenAcumulado[ordenAcumulado.length - 1].province} con un total de ${ordenAcumulado[ordenAcumulado.length - 1].acomulado} habitantes hasta la fecha [${fecha}]\n`);
                console.log(`• Si se habla del porcentaje de muertes por estado seria ${ordenPorcentaje[ordenPorcentaje.length -1].province} que tiene una poblacion de ${ordenPorcentaje[ordenPorcentaje.length -1].habitantes} y murio por Codiv19 un total de ${ordenPorcentaje[ordenPorcentaje.length -1].acomulado} habitantes que equivale al ${ordenPorcentaje[ordenPorcentaje.length -1].porcentaje}% de su poblacion total hasta la fecha [${fecha}]`);
                console.log('CSV file successfully');
            });
    } catch (error: any) {
        console.error(new Error(error));
    }
};

csvRead();
