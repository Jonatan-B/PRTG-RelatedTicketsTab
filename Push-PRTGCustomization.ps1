function Push-PRTGCustomization{
    <#
    .SYNOPSIS
    This function will push the updated html, css, and javascript files in the PRTG production folder.
    
    .DESCRIPTION
    This function will permanently replace the html, css, and javascript files in the \\prtgserver\c$\..\webroot\ folders so that the changes will be reflected in 
    the website. 
    
    .EXAMPLE
    Test-Customization
    #>

    begin {
        $filePaths = @{
            'JS'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\javascript';'File'='scripts_custom.js';};
            'HTMLHeader'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\includes';'File'='htmlheader_custom.htm';};
            'HTMLFooter'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\includes';'File'='htmlfooter_custom.htm';};
            'CSS'=@{'Folder'='\\prtgserver\c$\Program Files (x86)\PRTG Network Monitor\webroot\css';'File'='styles_custom.css';};            
        }

        $invalidKeys = @()
        foreach($key in $filePaths.keys){
            if(-not(Test-Path "$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)")){
                Write-Warning -Message "Unable to find the Repository file: $("$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)"))"
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
            if(-not(Test-Path $filePaths.$key.Folder)){
                Write-Warning -Message "Unable to find $($filePaths.$key.Folder)"
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

            Remove-Item $currentFile -Force
            Copy-Item "$($PSScriptRoot)\$(Split-Path $filePaths.$key.Folder -Leaf)\$($filePaths.$key.File)" -Destination $filePaths.$key.Folder -Force
        }
    }
}