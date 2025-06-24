import EnterURLComponent from "./enter_url_component";

function EnterURLPage() {

    return (
        <main id="enter-url-page" className="centered-page">
            <div className="icon-title">
                <img src="/icon.svg"/>
                <h1>ThermoPal</h1>
            </div>
            <div id="enter-url-explain">An API URL was not automatically detected. Please enter it below.</div>
            <EnterURLComponent navLink="/" label="API URL"/>
        </main>
    )
}

export default EnterURLPage;