(function () {

    function validateDateFence(dateArray) {
        var result = false,
            currentDate = new Date();

        if (dateArray && dateArray.length) {

            dateArray.forEach(function (date) {
                var dateMatchStart = true,
                    dateMatchEnd = true,
                    timeMatched = true;

                if (date.start) {
                    dateMatchStart = (currentDate >= (new Date(date.start)));
                }

                if (date.end) {
                    dateMatchEnd = (currentDate <= (new Date(date.end)));
                }

                if (date.time) {
                    timeMatched = validateTimeFence(date.time);
                }

                result |= dateMatchStart && dateMatchEnd && timeMatched;
            });

            return result;
        }
        return true;
    }

    function validateTimeFence(timeArray) {
        var result = false,
            currentTime = new Date();

        if (timeArray && timeArray.length) {

            timeArray.forEach(function (time) {

                if (time.split) {

                    var timeRange = time.split("-");

                    if (timeRange.length === 2) {

                        var startTimeRestriction = timeRange[0].split(":"),
                            endTimeRestriction = timeRange[1].split(":"),
                            startTime = new Date(),
                            endTime = new Date(),
                            setupTime = function (time, timeRestriction) {
                                time.setHours(parseInt(timeRestriction[0], 10));
                                time.setMinutes(parseInt(timeRestriction[1], 10));
                            };


                        if (startTimeRestriction.length >= 2 && endTimeRestriction.length >= 2) {
                            setupTime(startTime, startTimeRestriction);
                            setupTime(endTime, endTimeRestriction);

                            result |= (currentTime >= startTime && currentTime <= endTime);
                        }
                    }
                }
            });
            return result;
        }
        return true;
    }

    function validateIPFence(ipAddress, ipArray) {
        var regEx,
            result = false;

        if (ipAddress && ipArray && ipArray.length) {

            ipArray.forEach(function (ip) {
                regEx = new RegExp(ip.replace(".", "\\.").replace("*", "\\d*").replace("?", "\\d"));

                result |= regEx.test(ipAddress);
            });
            return result;
        }
        return true;
    }

    var fenceChecker = {


        validateFencing: function validateFencing(ipAddress, dossier) {

            var service = dossier && dossier.service,
                fence = service && service.fence;

            if (!fence) {
                return true;
            }

            return validateIPFence(ipAddress, fence.ip) && validateTimeFence(fence.time) && validateDateFence(fence.date);
        }
    };

    module.exports = fenceChecker;
})();
