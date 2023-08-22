let form = document.getElementById('join-form')

let displayName = sessionStorage.getItem('display_name')
if(displayName){
    form.name.value = displayName
}
form.addEventListener('submit', (e) =>{
    e.preventDefault()

    sessionStorage.setItem('display_name', e.target.name.value)

    let inviteCode = e.target.invite_link.value
    if(!inviteCode){
        inviteCode = String(Math.floor(Math.random() * 10000))
    }
    window.location = `index.html?room=${inviteCode}`
})

