const params = new URLSearchParams(window.location.search);
const alert = params.get('alert') ?? "";

if(alert == "currentPasswordNotMatch") {
    document.getElementById('alertWarpper').innerHTML += `<div class="alert alert-danger alert-dismissible fade show" role="alert">
        รหัสผ่านเดิมไม่ถูกต้อง
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`
}