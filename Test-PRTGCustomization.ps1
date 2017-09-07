function Test-PRTGCustomization {
    <#
    .SYNOPSIS
    This function will temporarily update the html, css, and javascript files in the PRTG production folder.
    
    .DESCRIPTION
    This function will temporarily replace the existing html, css, and javascript files in the \\prtgserver\c$\..\webroot\ folders so that the changes will be reflected in 
    the website, wait while the user tests the changes and revert back at the end of the function.
    
    .EXAMPLE
    Test-Customization
    #>

    begin {
        $filePaths = @{
            'JS'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\javascript';'File'='scripts_custom.js';'BkUpFile'='scripts_custom.bkup';};
            'HTMLHeader'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\includes';'File'='htmlheader_custom.htm';'BkUpFile'='htmlheader_custom.bkup'};
            'HTMLFooter'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\includes';'File'='htmlfooter_custom.htm';'BkUpFile'='htmlfooter_custom.bkup'};
            'CSS'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\css';'File'='styles_custom.css';'BkUpFile'='styles_custom.bkup'};            
        }

        $invalidKeys = @()
        foreach($key in $filePaths.keys){
            if(-not(Test-Path "$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)\$($filePaths.$key.File)")){
                Write-Warning -Message "Unable to find the Repository file: $("$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)\$($filePaths.$key.File)"))"
                $invalidKeys += $key
            }
        }

        if($invalidKeys.length -gt 0){
            foreach($key in $invalidKeys){
                $filePaths.Remove($key)
            }
        }

        $invalidKeys = @()
        foreach($key in $filePaths.keys){
            if(-not(Test-Path "$($filePaths.$key.Folder)\$($filePaths.$key.File)")){
                Write-Warning -Message "Unable to find $($filePaths.$key.File)"
                $invalidKeys += $key
            }
        }

        if($invalidKeys.length -gt 0){
            foreach($key in $invalidKeys){
                $filePaths.Remove($key)
            }
        }
    }
    process {
        foreach($key in $filePaths.Keys){
            $currentFile = "$($filePaths.$key.Folder)\$($filePaths.$key.File)"

            Rename-Item $currentFile -NewName $filePaths.$key.BkUpFile -Force
            Copy-Item "$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)\$($filePaths.$key.File)" -Destination $filePaths.$key.Folder -Force
        }

        Write-Host "Waiting for changes to be tested."
        Read-Host "Press any key to continue."
    }
    end {
        foreach($key in $filePaths.Keys){
            $currentFile = "$($filePaths.$key.Folder)\$($filePaths.$key.File)"
            $BkUpFile = "$($filePaths.$key.Folder)\$($filePaths.$key.BkUpFile)"

            Remove-Item -Path $currentFile -Force
            Rename-Item $BkUpFile -NewName $filePaths.$key.File
            
        }
    }
}