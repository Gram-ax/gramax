module.exports = () => {
    if (!process.env.DEBUG_JEST)
        console.log(
            "Disabled console logging, because of not debug run, to enable set DEBUG_JEST env"
        );

}
