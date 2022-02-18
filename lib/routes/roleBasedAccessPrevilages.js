const {permissions, campus,superAdmin} = require("../config")
console.log(permissions)
module.exports = [
    {
        method: "GET",
        path: "/rolebaseaccess",
        options: {
          description: "access previleges",
          tags: ["api"],
          validate: {
          },
          handler: async (request) => {
            const roleBaseAccess = {
              //students
              specialLogin:["Tanusree.deb.barma@gmail.com"],
              students: {
                view:[...permissions.updateStage,...permissions.addOrUpdateContact,...permissions.updateStudentName,...superAdmin],
                update: {
                  name: [],
                  email: [],
                  stage: [],
                  campus: [],
                  partner: [],
                  donor: [],
                  transitions: {
                    owner: [],
                    feedback: [],
                    deleteStage: [],
                    when: [],
                    finished: [],
                    status: [],
                  },
                },
              },
            
              //campus
              campus: {
                view:["Tanusree.deb.barma@gmail.com",...permissions.updateStage,...permissions.addOrUpdateContact,...permissions.updateStudentName,...superAdmin],
                
              },
            
              //partners
              partners: {
                view:["Tanusree.deb.barma@gmail.com",...permissions.updateStage,...permissions.addOrUpdateContact,...permissions.updateStudentName,...superAdmin],
                update: {
                  partnerDetails: [],
                  // redirectPartnerID: [],
                  createAssessment: [],
                  viewAssessment: [],
                  joinedStudentsProgress: [],
                  onlineTestForPartner: [],
                  merakiLink: [],
                  sendReport: [],
                },
              },
            };
            for (var i of campus){
                roleBaseAccess['campus'][i.name]={
                view:[...permissions.updateStage,...permissions.addOrUpdateContact,...permissions.updateStudentName,...superAdmin],
                update: {
                  name: [],
                  email: [],
                  stage: [],
                  partner: [],
                  donor: [],
                  evaluation: [],
                  transitions: {
                    owner: [],
                    feedback: [],
                    deleteStage: [],
                    startDate: [],
                    endDate: [],
                    status: [],
                  },
                },
                }
                if (i.name==="Tripura"){
                    roleBaseAccess['campus'][i.name].view.push("Tanusree.deb.barma@gmail.com")
                }
            }
            roleBaseAccess['campus']['All']={
                view:[...permissions.updateStage,...permissions.addOrUpdateContact,...permissions.updateStudentName,...superAdmin],
                update: {
                  name: [],
                  email: [],
                  stage: [],
                  partner: [],
                  donor: [],
                  evaluation: [],
                  transitions: {
                    owner: [],
                    feedback: [],
                    deleteStage: [],
                    startDate: [],
                    endDate: [],
                    status: [],
                  },
                },
                }

        
            
            return roleBaseAccess;
        },
        },
      }
]