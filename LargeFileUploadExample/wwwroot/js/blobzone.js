$(document).ready(function () {

    var blobZoneForms = document.getElementsByClassName('BlobZoneModForm');

    Array.from(blobZoneForms).forEach(function (item, index) {
        item.className += " container";
        var blobUri = item.getAttribute('data-blob-uri');
        var sasToken = item.getAttribute('data-sas-token');
        var containerName = item.getAttribute('data-blob-container-name');
        var fileLocation = item.getAttribute('data-file-location');
        var onCompleteFunction = eval(item.getAttribute('data-complete-function'));
        var blobZone = BlobZone(blobUri, sasToken, containerName, fileLocation, onCompleteFunction);

        GetTemplate();

        function GetTemplate() {
            $.ajax({
                url: "/js/templates/blobzonemodzone-template.html",
                dataType: 'html',
                cache: false,
                success: function (data, status, response) {
                    var template = response.responseText;
                    var handlebars = Handlebars.compile(template);
                    var context = { Index: index };
                    var html = handlebars(context);
                    $(item).append(html);
                    var dropArea = document.getElementById('blob-zone-' + index);
                    var uploadForm = document.getElementById('js-upload-form-' + index);

                    var startUpload = function (file) {
                        $.ajax({
                            url: "/js/templates/processed-file-bar-template.html",
                            dataType: 'html',
                            cache: false,
                            success: function (data, status, response) {
                                var context = { FileName: file[0].name };
                                var template = response.responseText;
                                var handlebars = Handlebars.compile(template);
                                var html = handlebars(context);
                                $("#uploaded-files-" + index).prepend(html);
                                blobZone(file[0]);
                            }
                        });
                    };

                    uploadForm.addEventListener('submit', function (e) {
                        var uploadFiles = document.getElementById('js-upload-files').files;
                        e.preventDefault()

                        startUpload(uploadFiles);
                    });

                    dropArea.ondrop = function (e) {
                        e.preventDefault();
                        this.className = 'bz-upload-drop-zone';
                        startUpload(e.dataTransfer.files);
                    };

                    dropArea.ondragover = function () {
                        this.className = 'bz-upload-drop-zone drop';
                        return false;
                    };

                    dropArea.ondragleave = function () {
                        this.className = 'bz-upload-drop-zone';
                        return false;
                    };
                }
            });
        };
    });
});


function BlobZone(blobUri, dirtySaSToken, containerName, fileLocation, onCompleteFunction) {
    return function (file) {
        var sasToken = dirtySaSToken.replace(/&amp;/g, "&");
        var blobService = AzureStorage.createBlobServiceWithSas(blobUri, sasToken);

        var Buffer = require('buffer').Buffer;
        var Stream = require('stream');
        var util = require('util');

        function FileStream(file, opt) {
            Stream.Readable.call(this, opt);
            console.log(opt);
            this.fileReader = new FileReader(file);
            this.file = file;
            this.size = file.size;
            this.chunkSize = 1024 * 1024 * 4; // 4MB
            this.offset = 0;
            var _me = this;

            this.fileReader.onloadend = function loaded(event) {
                var data = event.target.result;
                var buf = Buffer.from(data);
                _me.push(buf);
            }
        }

        util.inherits(FileStream, Stream.Readable);

        FileStream.prototype._read = function () {
            if (this.offset > this.size) {
                this.push(null);
            }
            else {
                var end = this.offset + this.chunkSize;
                var slice = this.file.slice(this.offset, end);
                this.fileReader.readAsArrayBuffer(slice);
                this.offset = end;
            }
        };

        var fileStream = new FileStream(file);
        var customBlockSize = file.size > 1024 * 1024 * 32 ? 1024 * 1024 * 4 : 1024 * 512;
        var finishedOrError = false;
        var fullFileName = fileLocation + file.name;
        var onFinishedFunction = function () { };

        blobService.singleBlobPutThresholdInBytes = customBlockSize;

        var speedSummary = blobService.createBlockBlobFromStream(containerName, fullFileName, fileStream, file.size, { blockSize: customBlockSize }, function (error, result, response) {
            finishedOrError = true;
            if (error) {
                // Upload blob failed
                document.getElementById("progress-bar-" + file.name).style.width = "0%";
                var processedFile = document.getElementById(file.name);
                var badge = processedFile.firstElementChild;

                processedFile.classList.remove("list-group-item-warning");
                processedFile.classList.add("list-group-item-danger");

                badge.innerHTML = " ";
                badge.classList.remove("alert-warning");
                badge.classList.add("alert-danger");
                badge.classList.add("glyphicon");
                badge.classList.add("glyphicon-remove-sign");
                onFinishedFunction = onCompleteFunction(false, blobUri + fullFileName);

            } else {
                // Upload successfully
                document.getElementById("progress-bar-" + file.name).style.width = "100%";
                var processedFile = document.getElementById(file.name);
                var badge = processedFile.firstElementChild;

                processedFile.classList.remove("list-group-item-warning");
                processedFile.classList.add("list-group-item-success");

                badge.innerHTML = " ";
                badge.classList.remove("alert-warning");
                badge.classList.add("alert-success");
                badge.classList.add("glyphicon");
                badge.classList.add("glyphicon-ok-sign");
                onFinishedFunction = onCompleteFunction(true, blobUri + containerName + '/' + fullFileName);
            }
        });

        refreshProgress();


        function refreshProgress() {
            setTimeout(function () {
                if (!finishedOrError) {
                    var process = speedSummary.getCompletePercent();
                    document.getElementById("progress-bar-" + file.name).style.width = process + "%";
                    document.getElementById('span-' + file.name).innerHTML = "Loading: " + process + "%";
                    refreshProgress();
                }
            }, 100);
            onFinishedFunction();
        };

    };
};

function BlobZoneInitializer(o) {
    var BlobZoneInitializerObject = {
        blobUri: o.blobUri,
        dirtySaSToken: o.dirtySaSToken,
        containerName: o.containerName,
        fileLocation: o.fileLocation,
        zoneDivId: o.zoneDivId,
        onSuccess: o.onSuccess,
        onFailure: o.onFailure,
        Initialize: function () {
        var form = document.getElementById(this.zoneDivId);
        var blobZone = BlobZone(this.blobUri, this.dirtySaSToken, this.containerName, this.fileLocation, this.onSuccess);
        GetTemplate();

        function GetTemplate() {
            $.ajax({
                url: "/js/templates/blobzonemodzone-template.html",
                dataType: 'html',
                cache: false,
                success: function (data, status, response) {
                    var template = response.responseText;
                    var handlebars = Handlebars.compile(template);
                    var context = { Index: BlobZoneInitializerObject.zoneDivId };
                    var html = handlebars(context);
                    $(form).append(html);
                    var dropArea = document.getElementById('blob-zone-' + BlobZoneInitializerObject.zoneDivId);
                    var uploadForm = document.getElementById('js-upload-form-' + BlobZoneInitializerObject.zoneDivId);

                    var startUpload = function (file) {
                        $.ajax({
                            url: "/js/templates/processed-file-bar-template.html",
                            dataType: 'html',
                            cache: false,
                            success: function (data, status, response) {
                                var context = { FileName: file[0].name };
                                var template = response.responseText;
                                var handlebars = Handlebars.compile(template);
                                var html = handlebars(context);
                                $("#uploaded-files-" + BlobZoneInitializerObject.zoneDivId).prepend(html);
                                blobZone(file[0]);
                            }
                        });
                    };

                    uploadForm.addEventListener('submit', function (e) {
                        var uploadFiles = document.getElementById('js-upload-files').files;
                        e.preventDefault()

                        startUpload(uploadFiles);
                    });

                    dropArea.ondrop = function (e) {
                        e.preventDefault();
                        this.className = 'bz-upload-drop-zone';
                        startUpload(e.dataTransfer.files);
                    };

                    dropArea.ondragover = function () {
                        this.className = 'bz-upload-drop-zone drop';
                        return false;
                    };

                    dropArea.ondragleave = function () {
                        this.className = 'bz-upload-drop-zone';
                        return false;
                    };
                }
            });
        };

    }
    };
    return BlobZoneInitializerObject;
};
