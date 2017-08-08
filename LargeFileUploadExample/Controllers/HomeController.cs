using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Shared.Protocol;
using Microsoft.WindowsAzure.Storage.Blob;
using LargeFileUploadExample.Models;

namespace LargeFileUploadExample.Controllers
{
    public class HomeController : Controller
    {

        //[HttpPost]
        //public ActionResult PrepareMetaData(int blocksCount, string fileName, long fileSize)
        //{
        //    CloudStorageAccount storageAccount = new CloudStorageAccount(
        //        new Microsoft.WindowsAzure.Storage.Auth.StorageCredentials(
        //        "<storage-account-name>",
        //        "<access-key>"), true);
        //    // Create a blob client.
        //    CloudBlobClient blobClient = storageAccount.CreateCloudBlobClient();

        //    // Get a reference to a container named "mycontainer."
        //    CloudBlobContainer container = blobClient.GetContainerReference("mycontainer");

            

        //    return Json(true);
        //}

        public IActionResult Index()
        {
            var vm = new UploadViewModel()
            {
                SaSToken = GetAccountSASToken(),
                ContainerName = "conrad",
                BlobUri = "https://ctabor.blob.core.windows.net"
            };

            return View(vm);
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult Error()
        {
            return View();
        }

        private string GetAccountSASToken()
        {
            // To create the account SAS, you need to use your shared key credentials. Modify for your account.
            const string ConnectionString = "<connectionstring>";
            CloudStorageAccount storageAccount = CloudStorageAccount.Parse(ConnectionString);

            // Create a new access policy for the account.
            SharedAccessAccountPolicy policy = new SharedAccessAccountPolicy()
            {
                Permissions = SharedAccessAccountPermissions.Read | SharedAccessAccountPermissions.Write | SharedAccessAccountPermissions.List | SharedAccessAccountPermissions.Add | SharedAccessAccountPermissions.Create,
                Services = SharedAccessAccountServices.Blob | SharedAccessAccountServices.File,
                ResourceTypes = SharedAccessAccountResourceTypes.Container | SharedAccessAccountResourceTypes.Object | SharedAccessAccountResourceTypes.Service,
                SharedAccessExpiryTime = DateTime.UtcNow.AddHours(24),
                Protocols = SharedAccessProtocol.HttpsOnly
            };

            // Return the SAS token.
            return storageAccount.GetSharedAccessSignature(policy);
        }
    }
}
