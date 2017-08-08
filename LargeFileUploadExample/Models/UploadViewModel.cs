using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LargeFileUploadExample.Models
{
    public class UploadViewModel
    {
        public string SaSToken { get; set; }
        public string BlobUri { get; set; }
        public string ContainerName { get; set; }
        public string MetaDataAboutUpload { get; set; }
    }
}
