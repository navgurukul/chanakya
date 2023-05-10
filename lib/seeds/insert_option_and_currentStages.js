/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

const fs=require("fs")
const path=require("path")
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  //  Read stages.json data
  // get current id and option id
  // insert all id into table
  try{
    const fileName=path.join(__dirname,"stages.json")
    const readData=fs.readFileSync(fileName)
    const parseData=JSON.parse(readData)
    for (let [key,value]of Object.entries(parseData)){
      const stageId = await knex("new_student_stages").where("stage",key);
      
      for (let j of value){
        const optionId = await knex("new_student_stages").where("stage",j);
              
      await knex("student_stage_options").insert({ current_stage: stageId[0].id, option_stage:optionId[0].id })
      }
      // return
    }
  }
  catch (error) {
    console.log(error)
    return error
  } 
};
